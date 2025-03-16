const express = require("express");
const router = express.Router();
const Ride = require("../models/Ride");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const PlatformCommission = require("../models/PlatformCommission");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");

// Get all rides (filtered by role)
router.get("/", auth, async (req, res) => {
  try {
    let rides;

    if (req.user.role === "passenger") {
      rides = await Ride.find({ passenger: req.user._id })
        .populate("driver", "name phoneNumber")
        .populate({
          path: "transactions",
          select: "type amount commission",
          match: { type: { $in: ["COMMITMENT_FEE", "REFUND", "COMMISSION"] } },
        })
        .sort({ createdAt: -1 });
    } else {
      // Drivers see pending rides and their accepted rides
      rides = await Ride.find({
        $or: [{ status: "PENDING" }, { driver: req.user._id }],
      })
        .populate("passenger", "name phoneNumber")
        .populate({
          path: "transactions",
          select: "type amount commission",
          match: { type: { $in: ["COMMITMENT_FEE", "REFUND", "COMMISSION"] } },
        })
        .sort({ createdAt: -1 });
    }

    // Add refund information to each ride
    const ridesWithRefunds = rides.map((ride) => {
      const rideObj = ride.toObject();
      const refundTransaction = rideObj.transactions?.find(
        (t) => t.type === "REFUND"
      );
      const commissionTransaction = rideObj.transactions?.find(
        (t) => t.type === "COMMISSION"
      );

      // Get platform fee percentage from cancellation details or use default
      const platformFeePercentage =
        rideObj.cancellationDetails?.platformFeePercentage || 0.1;
      const convenienceFeePercentage =
        rideObj.cancellationDetails?.convenienceFeePercentage || 0.9;

      return {
        ...rideObj,
        refundAmount:
          refundTransaction?.amount ||
          rideObj.cancellationDetails?.passengerRefundAmount ||
          rideObj.cancellationDetails?.driverRefundAmount ||
          0,
        commissionAmount:
          commissionTransaction?.amount ||
          rideObj.cancellationDetails?.platformCommission ||
          0,
        platformFeePercentage,
        convenienceFeePercentage,
      };
    });

    res.json(ridesWithRefunds);
  } catch (error) {
    console.error("Error fetching rides:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new ride
router.post("/", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      bookingType,
      pickup,
      destination,
      distance,
      hours,
      scheduledTime,
      fare,
      commitmentFee,
    } = req.body;

    // Validate required fields
    if (!bookingType || !pickup || !scheduledTime || !fare || !commitmentFee) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate point-to-point specific fields
    if (bookingType === "POINT_TO_POINT" && (!destination || !distance)) {
      return res.status(400).json({ message: "Missing point-to-point fields" });
    }

    // Validate hourly specific fields
    if (bookingType === "HOURLY" && !hours) {
      return res.status(400).json({ message: "Missing hourly booking fields" });
    }

    // Check if user has sufficient balance for commitment fee
    const user = await User.findById(req.user._id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.wallet || typeof user.wallet.balance !== "number") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid wallet balance" });
    }

    if (user.wallet.balance < commitmentFee) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Insufficient balance for commitment fee" });
    }

    // Create ride
    const ride = new Ride({
      passenger: req.user._id,
      bookingType,
      pickup,
      destination,
      distance,
      hours,
      scheduledTime: new Date(scheduledTime),
      fare,
      commitmentFee,
      status: "PENDING",
    });

    // Create commitment fee transaction
    const commitmentTransaction = new Transaction({
      type: "COMMITMENT_FEE",
      amount: commitmentFee,
      description: `Commitment fee for ride from ${pickup} to ${
        destination || "hourly ride"
      }`,
      rideId: ride._id,
      timestamp: new Date(),
    });

    // Initialize transactions array if it doesn't exist
    if (!user.wallet.transactions) {
      user.wallet.transactions = [];
    }

    // Deduct commitment fee from passenger's wallet
    user.wallet.balance = Number(user.wallet.balance) - Number(commitmentFee);
    user.wallet.transactions.push(commitmentTransaction._id);

    // Save ride, transaction and user
    await Promise.all([
      ride.save({ session }),
      commitmentTransaction.save({ session }),
      user.save({ session }),
    ]);

    await session.commitTransaction();

    // Fetch the populated ride to return
    const populatedRide = await Ride.findById(ride._id)
      .populate("passenger", "name phoneNumber")
      .populate("driver", "name phoneNumber");

    res.status(201).json(populatedRide);
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating ride:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    session.endSession();
  }
});

// Accept a ride
router.put("/:id/accept", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if user is a driver
    if (req.user.role !== "driver") {
      return res.status(403).json({ message: "Only drivers can accept rides" });
    }

    // Find ride and check if it can be accepted
    const ride = await Ride.findById(req.params.id).session(session);
    if (!ride) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Ride not found" });
    }
    if (ride.status !== "PENDING") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Ride cannot be accepted" });
    }

    // Check if driver has sufficient balance for commitment fee
    const driver = await User.findById(req.user._id).session(session);
    if (!driver) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Driver not found" });
    }

    if (!driver.wallet || typeof driver.wallet.balance !== "number") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid wallet balance" });
    }

    if (driver.wallet.balance < ride.commitmentFee) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Insufficient balance for commitment fee" });
    }

    // Create commitment fee transaction for driver
    const driverCommitmentTransaction = new Transaction({
      type: "COMMITMENT_FEE",
      amount: ride.commitmentFee,
      description: `Driver commitment fee for ride from ${ride.pickup} to ${
        ride.destination || "hourly ride"
      }`,
      rideId: ride._id,
      timestamp: new Date(),
    });

    // Initialize transactions array if it doesn't exist
    if (!driver.wallet.transactions) {
      driver.wallet.transactions = [];
    }

    // Update ride and deduct commitment fee
    ride.driver = req.user._id;
    ride.status = "ACCEPTED";
    ride.acceptedAt = new Date();
    driver.wallet.balance =
      Number(driver.wallet.balance) - Number(ride.commitmentFee);
    driver.wallet.transactions.push(driverCommitmentTransaction._id);

    // Save all changes
    await Promise.all([
      ride.save({ session }),
      driverCommitmentTransaction.save({ session }),
      driver.save({ session }),
    ]);

    await session.commitTransaction();

    // Fetch the populated ride to return
    const populatedRide = await Ride.findById(ride._id)
      .populate("passenger", "name phoneNumber")
      .populate("driver", "name phoneNumber");

    res.json(populatedRide);
  } catch (error) {
    await session.abortTransaction();
    console.error("Error accepting ride:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    session.endSession();
  }
});

// Start a ride
router.put("/:id/start", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if user is a driver
    if (req.user.role !== "driver") {
      return res.status(403).json({ message: "Only drivers can start rides" });
    }

    // Find ride and check if it can be started
    const ride = await Ride.findById(req.params.id).session(session);
    if (!ride) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.status !== "ACCEPTED") {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Only accepted rides can be started" });
    }

    if (ride.driver.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res
        .status(403)
        .json({ message: "Only assigned driver can start the ride" });
    }

    // Update ride status
    ride.status = "IN_PROGRESS";
    ride.startedAt = new Date();

    await ride.save({ session });
    await session.commitTransaction();

    // Fetch the populated ride to return
    const populatedRide = await Ride.findById(ride._id)
      .populate("passenger", "name phoneNumber")
      .populate("driver", "name phoneNumber");

    res.json(populatedRide);
  } catch (error) {
    await session.abortTransaction();
    console.error("Error starting ride:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    session.endSession();
  }
});

// Complete a ride
router.put("/:id/complete", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find ride and check if it can be completed
    const ride = await Ride.findById(req.params.id).session(session);
    if (!ride) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.status !== "IN_PROGRESS") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Ride cannot be completed" });
    }

    if (ride.driver.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res
        .status(403)
        .json({ message: "Only assigned driver can complete the ride" });
    }

    // Get fresh copies of passenger and driver
    const [passenger, driver] = await Promise.all([
      User.findById(ride.passenger).session(session),
      User.findById(ride.driver).session(session),
    ]);

    if (!passenger || !driver) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }

    // Validate wallet objects
    if (
      !passenger.wallet ||
      typeof passenger.wallet.balance !== "number" ||
      !driver.wallet ||
      typeof driver.wallet.balance !== "number"
    ) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid wallet balance" });
    }

    // Initialize transactions arrays if they don't exist
    if (!passenger.wallet.transactions) {
      passenger.wallet.transactions = [];
    }
    if (!driver.wallet.transactions) {
      driver.wallet.transactions = [];
    }

    // Only refund the driver's commitment fee
    const driverRefundTransaction = new Transaction({
      type: "REFUND",
      amount: ride.commitmentFee,
      description: `Driver commitment fee refund for completed ride from ${
        ride.pickup
      } to ${ride.destination || "hourly ride"}`,
      rideId: ride._id,
      timestamp: new Date(),
    });

    // Return commitment fee to driver only
    driver.wallet.balance =
      Number(driver.wallet.balance) + Number(ride.commitmentFee);
    driver.wallet.transactions.push(driverRefundTransaction._id);

    // Calculate total payment to driver (fare + passenger commitment fee)
    const totalDriverPayment = Number(ride.fare) + Number(ride.commitmentFee);

    // Check if passenger has sufficient balance for fare
    if (passenger.wallet.balance < ride.fare) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Passenger has insufficient balance for fare" });
    }

    // Create fare payment transactions
    const passengerDebitTransaction = new Transaction({
      type: "DEBIT",
      amount: ride.fare,
      description: `Fare payment for ride from ${ride.pickup} to ${
        ride.destination || "hourly ride"
      }`,
      rideId: ride._id,
      timestamp: new Date(),
    });

    const driverCreditTransaction = new Transaction({
      type: "CREDIT",
      amount: totalDriverPayment,
      description: `Total fare received (including commitment fee) for ride from ${
        ride.pickup
      } to ${ride.destination || "hourly ride"}`,
      rideId: ride._id,
      timestamp: new Date(),
    });

    // Transfer fare from passenger to driver
    passenger.wallet.balance =
      Number(passenger.wallet.balance) - Number(ride.fare);
    // Driver gets fare + passenger commitment fee (which is already in escrow)
    driver.wallet.balance = Number(driver.wallet.balance) + Number(ride.fare);
    passenger.wallet.transactions.push(passengerDebitTransaction._id);
    driver.wallet.transactions.push(driverCreditTransaction._id);

    // NEW CODE: Add bonus for driver from admin for completing the committed ride
    // Calculate bonus amount (5% of the fare)
    const bonusAmount = Math.round(Number(ride.fare) * 0.05);

    // Create bonus transaction
    const driverBonusTransaction = new Transaction({
      type: "CREDIT",
      amount: bonusAmount,
      description: `Bonus reward for completing committed ride from ${
        ride.pickup
      } to ${ride.destination || "hourly ride"}`,
      rideId: ride._id,
      timestamp: new Date(),
    });

    // Add bonus to driver's wallet
    driver.wallet.balance = Number(driver.wallet.balance) + bonusAmount;
    driver.wallet.transactions.push(driverBonusTransaction._id);

    // Update ride to include the bonus information
    ride.driverBonus = bonusAmount;

    // Create a platform commission record to track the bonus as an expense
    const platformBonusCommission = new PlatformCommission({
      rideId: ride._id,
      amount: -bonusAmount, // Negative amount to indicate expense
      type: "RIDE_COMMISSION",
      source: "DRIVER",
      description: `Driver bonus payment for completing ride from ${
        ride.pickup
      } to ${ride.destination || "hourly ride"}`,
      timestamp: new Date(),
    });

    // Update ride status
    ride.status = "COMPLETED";
    ride.completedAt = new Date();

    // Save all changes
    await Promise.all([
      ride.save({ session }),
      driverRefundTransaction.save({ session }),
      passengerDebitTransaction.save({ session }),
      driverCreditTransaction.save({ session }),
      driverBonusTransaction.save({ session }),
      platformBonusCommission.save({ session }),
      passenger.save({ session }),
      driver.save({ session }),
    ]);

    await session.commitTransaction();

    // Fetch the populated ride to return
    const populatedRide = await Ride.findById(ride._id)
      .populate("passenger", "name phoneNumber")
      .populate("driver", "name phoneNumber");

    res.json(populatedRide);
  } catch (error) {
    await session.abortTransaction();
    console.error("Error completing ride:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    session.endSession();
  }
});

// Get cancellation penalties
router.get("/:id/penalties", auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Determine who is cancelling based on user role or query parameter
    const userType = req.query.userType || req.user.role;
    const cancelledBy = userType === "passenger" ? "passenger" : "driver";

    // Calculate penalties with the cancelledBy parameter
    const penalties = ride.calculateCancellationPenalties(cancelledBy);

    // Add additional information for clarity
    penalties.commitmentFee = ride.commitmentFee;
    penalties.hasDriver = !!ride.driver;
    penalties.status = ride.status;

    // Ensure convenience fee is properly calculated if a driver has accepted
    if (ride.driver && ride.status === "ACCEPTED") {
      if (cancelledBy === "passenger") {
        // Make sure driver gets the convenience fee
        penalties.driverConvenienceFee = Math.max(
          0.01, // Ensure it's never zero
          penalties.penaltyAmount * penalties.convenienceFeePercentage
        );
      } else if (cancelledBy === "driver") {
        // Make sure passenger gets the convenience fee
        penalties.passengerConvenienceFee = Math.max(
          0.01, // Ensure it's never zero
          penalties.penaltyAmount * penalties.convenienceFeePercentage
        );

        // For drivers, ensure there's always at least a small penalty
        // This prevents the "full refund" message from showing incorrectly
        if (penalties.penaltyAmount < 0.01 && penalties.minutesUntilRide > 0) {
          const minPenalty = Math.max(1, ride.commitmentFee * 0.01); // At least 1% penalty
          penalties.penaltyAmount = minPenalty;
          // Use exact calculation without rounding
          penalties.platformAmount = Math.max(
            0.01,
            minPenalty * penalties.platformFeePercentage
          );
          penalties.convenienceFee = Math.max(
            0.01,
            minPenalty * penalties.convenienceFeePercentage
          );
          penalties.driverRefundAmount = ride.commitmentFee - minPenalty;
          penalties.passengerConvenienceFee = penalties.convenienceFee;
          penalties.timeThreshold = 0.01; // Small but non-zero threshold
        }
      }
    }

    // For passengers with a driver, ensure there's always at least a small penalty
    if (
      cancelledBy === "passenger" &&
      ride.driver &&
      penalties.penaltyAmount < 0.01 &&
      penalties.minutesUntilRide > 0
    ) {
      const minPenalty = Math.max(0.5, ride.commitmentFee * 0.005); // At least 0.5% penalty
      penalties.penaltyAmount = minPenalty;
      // Use exact calculation without rounding
      penalties.platformAmount = Math.max(
        0.01,
        minPenalty * penalties.platformFeePercentage
      );
      penalties.convenienceFee = Math.max(
        0.01,
        minPenalty * penalties.convenienceFeePercentage
      );
      penalties.passengerRefundAmount = ride.commitmentFee - minPenalty;
      penalties.driverConvenienceFee = penalties.convenienceFee;
      penalties.timeThreshold = 0.005; // Small but non-zero threshold
    }

    res.json(penalties);
  } catch (error) {
    console.error("Error calculating penalties:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel a ride
router.put("/:id/cancel", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find ride and check if it can be cancelled
    const ride = await Ride.findById(req.params.id).session(session);
    if (!ride) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Ride not found" });
    }

    const isDriver = req.user._id.equals(ride.driver);
    const isPassenger = req.user._id.equals(ride.passenger);

    if (!isDriver && !isPassenger) {
      await session.abortTransaction();
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this ride" });
    }

    if (ride.status === "COMPLETED" || ride.status === "CANCELLED") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Ride cannot be cancelled" });
    }

    // Calculate penalty based on cancellation time
    const now = new Date();
    const scheduledTime = new Date(ride.scheduledTime);
    const timeDiff = scheduledTime - now;
    const penaltyDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    const inPenaltyPeriod = timeDiff <= penaltyDuration;

    let penaltyAmount = 0;
    const platformCommissionRate = 0.2; // 20% platform commission

    if (inPenaltyPeriod) {
      penaltyAmount = ride.commitmentFee;
    }

    // Find passenger and driver
    const passenger = await User.findById(ride.passenger).session(session);
    const driver = ride.driver
      ? await User.findById(ride.driver).session(session)
      : null;

    // Initialize transactions array if it doesn't exist
    if (!ride.transactions) {
      ride.transactions = [];
    }

    // Calculate platform commission
    const platformCommission = penaltyAmount * platformCommissionRate;

    // Handle passenger refund
    if (passenger) {
      let passengerRefundAmount =
        ride.commitmentFee - (isPassenger ? penaltyAmount : 0);

      // If in penalty period but no driver accepted, refund driver's portion but keep platform commission
      if (inPenaltyPeriod && !driver) {
        passengerRefundAmount =
          ride.commitmentFee - ride.commitmentFee * platformCommissionRate;
      }

      if (passengerRefundAmount > 0) {
        const refundTransaction = new Transaction({
          type: "REFUND",
          amount: passengerRefundAmount,
          description: "Ride cancellation refund",
          rideId: ride._id,
          userId: passenger._id,
          timestamp: new Date(),
        });

        // Add transaction to ride's transactions array
        ride.transactions.push(refundTransaction._id);

        passenger.wallet.balance =
          Number(passenger.wallet.balance) + passengerRefundAmount;
        passenger.wallet.transactions.push(refundTransaction._id);
        await refundTransaction.save({ session });
        await passenger.save({ session });
      }

      // Create commission transaction if penalty applies
      if (inPenaltyPeriod) {
        const commissionAmount = ride.commitmentFee * platformCommissionRate;
        const commissionTransaction = new Transaction({
          type: "COMMISSION",
          amount: commissionAmount,
          description: "Platform commission from cancelled ride",
          rideId: ride._id,
          userId: passenger._id,
          commission: commissionAmount,
          timestamp: new Date(),
        });

        // Add transaction to ride's transactions array
        ride.transactions.push(commissionTransaction._id);

        await commissionTransaction.save({ session });
      }
    }

    // Handle driver refund if exists and not the canceller
    if (driver && !isDriver) {
      const driverRefundAmount = ride.commitmentFee;
      if (driverRefundAmount > 0) {
        const refundTransaction = new Transaction({
          type: "REFUND",
          amount: driverRefundAmount,
          description: "Ride cancellation refund",
          rideId: ride._id,
          userId: driver._id,
          timestamp: new Date(),
        });

        // Add transaction to ride's transactions array
        ride.transactions.push(refundTransaction._id);

        driver.wallet.balance =
          Number(driver.wallet.balance) + driverRefundAmount;
        driver.wallet.transactions.push(refundTransaction._id);
        await refundTransaction.save({ session });
        await driver.save({ session });
      }
    }

    // Update ride status and save with transactions
    ride.status = "CANCELLED";
    ride.cancelledAt = new Date();
    ride.cancelledBy = req.user._id;
    await ride.save({ session });

    await session.commitTransaction();
    res.json({ message: "Ride cancelled successfully" });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error cancelling ride:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    session.endSession();
  }
});

module.exports = router;
