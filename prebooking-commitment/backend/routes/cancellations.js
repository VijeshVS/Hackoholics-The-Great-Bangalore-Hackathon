const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Ride = require("../models/Ride");
const Transaction = require("../models/Transaction");
const PlatformCommission = require("../models/PlatformCommission");
const User = require("../models/User");
const auth = require("../middleware/auth");

// Get cancellation penalties for a ride
router.get("/:rideId/penalties", auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    const penalties = ride.calculateCancellationPenalties();
    res.json(penalties);
  } catch (error) {
    console.error("Error calculating penalties:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Cancel a ride
router.post("/:rideId/cancel", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason, cancelledBy } = req.body;
    const ride = await Ride.findById(req.params.rideId).session(session);

    if (!ride) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Ride not found" });
    }

    // Check if ride can be cancelled
    if (ride.status !== "PENDING" && ride.status !== "ACCEPTED") {
      await session.abortTransaction();
      return res.status(400).json({ error: "Ride cannot be cancelled" });
    }

    // Verify that the user is authorized to cancel this ride
    if (
      cancelledBy === "passenger" &&
      ride.passenger.toString() !== req.user._id.toString()
    ) {
      await session.abortTransaction();
      return res
        .status(403)
        .json({ error: "Not authorized to cancel this ride" });
    }
    if (
      cancelledBy === "driver" &&
      ride.driver?.toString() !== req.user._id.toString()
    ) {
      await session.abortTransaction();
      return res
        .status(403)
        .json({ error: "Not authorized to cancel this ride" });
    }

    // Calculate penalties using the exponential algorithm
    const penalties = ride.calculateCancellationPenalties(cancelledBy);
    const {
      penaltyAmount,
      platformAmount,
      timeThreshold,
      passengerRefundAmount,
      driverRefundAmount,
      passengerConvenienceFee,
      driverConvenienceFee,
      platformFeePercentage,
      convenienceFeePercentage,
      refundRatio,
    } = penalties;

    // Update ride status
    ride.status = "CANCELLED";

    ride.cancellationDetails = {
      cancelledBy,
      cancelledAt: new Date(),
      reason,
      penaltyAmount,
      platformCommission: platformAmount,
      passengerRefundAmount,
      driverRefundAmount,
      passengerConvenienceFee,
      driverConvenienceFee,
      platformFeePercentage,
      convenienceFeePercentage,
      refundRatio,
    };

    // If no driver has accepted, ensure the refund amount is calculated correctly
    if (!ride.driver && cancelledBy === "passenger") {
      // Provide full refund to passenger if no driver has accepted yet
      ride.cancellationDetails.passengerRefundAmount = ride.commitmentFee;
      ride.cancellationDetails.penaltyAmount = 0;
      ride.cancellationDetails.platformCommission = 0;
    }

    // Create platform commission record if there's a penalty
    if (platformAmount > 0) {
      const commission = new PlatformCommission({
        rideId: ride._id,
        amount: platformAmount,
        type: "CANCELLATION",
        source: cancelledBy.toUpperCase(),
        description: `Cancellation fee from ${cancelledBy} for ride ${ride._id}`,
      });
      await commission.save({ session });
    }

    // Process refunds and penalties
    if (penaltyAmount > 0) {
      // Create transactions
      const transactions = [];

      // Penalty transaction for cancelling party
      const penaltyTransaction = new Transaction({
        type: "DEBIT",
        amount: penaltyAmount,
        description: `Cancellation penalty for ride ${ride._id}`,
        rideId: ride._id,
        userId: cancelledBy === "passenger" ? ride.passenger : ride.driver,
      });
      await penaltyTransaction.save({ session });
      transactions.push(penaltyTransaction);

      // Platform fee transaction
      if (platformAmount > 0) {
        const platformFeeTransaction = new Transaction({
          type: "COMMISSION",
          amount: platformAmount,
          description: `Platform fee (10%) for cancelled ride ${ride._id}`,
          rideId: ride._id,
          userId: cancelledBy === "passenger" ? ride.passenger : ride.driver,
        });
        await platformFeeTransaction.save({ session });
        transactions.push(platformFeeTransaction);

        // Add transaction to ride's transactions
        ride.transactions.push(platformFeeTransaction._id);
      }

      // Process passenger refund if applicable
      if (passengerRefundAmount > 0) {
        let refundPercentage = Math.round(
          (passengerRefundAmount / ride.commitmentFee) * 100
        );

        const passengerRefundTransaction = new Transaction({
          type: "REFUND",
          amount: passengerRefundAmount,
          description: `Refund (${refundPercentage}%) for cancelled ride ${ride._id}`,
          rideId: ride._id,
          userId: ride.passenger,
        });
        await passengerRefundTransaction.save({ session });
        transactions.push(passengerRefundTransaction);

        // Add transaction to ride's transactions
        ride.transactions.push(passengerRefundTransaction._id);

        // Update passenger wallet
        await User.findByIdAndUpdate(
          ride.passenger,
          {
            $inc: { "wallet.balance": passengerRefundAmount },
            $push: { "wallet.transactions": passengerRefundTransaction._id },
          },
          { session }
        );
      }

      // Process driver refund if applicable
      if (ride.driver && driverRefundAmount > 0) {
        const refundPercentage = Math.round(
          (driverRefundAmount / ride.commitmentFee) * 100
        );
        const driverRefundTransaction = new Transaction({
          type: "REFUND",
          amount: driverRefundAmount,
          description: `Refund (${refundPercentage}%) for cancelled ride ${ride._id}`,
          rideId: ride._id,
          userId: ride.driver,
        });
        await driverRefundTransaction.save({ session });
        transactions.push(driverRefundTransaction);

        // Add transaction to ride's transactions
        ride.transactions.push(driverRefundTransaction._id);

        // Update driver wallet
        await User.findByIdAndUpdate(
          ride.driver,
          {
            $inc: { "wallet.balance": driverRefundAmount },
            $push: { "wallet.transactions": driverRefundTransaction._id },
          },
          { session }
        );
      }

      // Process passenger convenience fee if applicable
      if (passengerConvenienceFee > 0) {
        const passengerConvenienceTransaction = new Transaction({
          type: "CREDIT",
          amount: passengerConvenienceFee,
          description: `Convenience fee (90%) for cancelled ride ${ride._id}`,
          rideId: ride._id,
          userId: ride.passenger,
        });
        await passengerConvenienceTransaction.save({ session });
        transactions.push(passengerConvenienceTransaction);

        // Add transaction to ride's transactions
        ride.transactions.push(passengerConvenienceTransaction._id);

        // Update passenger wallet
        await User.findByIdAndUpdate(
          ride.passenger,
          {
            $inc: { "wallet.balance": passengerConvenienceFee },
            $push: {
              "wallet.transactions": passengerConvenienceTransaction._id,
            },
          },
          { session }
        );
      }

      // Process driver convenience fee if applicable
      if (ride.driver && driverConvenienceFee > 0) {
        const driverConvenienceTransaction = new Transaction({
          type: "CREDIT",
          amount: driverConvenienceFee,
          description: `Convenience fee (90%) for cancelled ride ${ride._id}`,
          rideId: ride._id,
          userId: ride.driver,
        });
        await driverConvenienceTransaction.save({ session });
        transactions.push(driverConvenienceTransaction);

        // Add transaction to ride's transactions
        ride.transactions.push(driverConvenienceTransaction._id);

        // Update driver wallet
        await User.findByIdAndUpdate(
          ride.driver,
          {
            $inc: { "wallet.balance": driverConvenienceFee },
            $push: { "wallet.transactions": driverConvenienceTransaction._id },
          },
          { session }
        );
      }

      // Update the cancelling party's wallet with the penalty
      if (cancelledBy === "passenger") {
        await User.findByIdAndUpdate(
          ride.passenger,
          {
            $inc: { "wallet.balance": -penaltyAmount },
            $push: { "wallet.transactions": penaltyTransaction._id },
          },
          { session }
        );
      } else if (cancelledBy === "driver") {
        await User.findByIdAndUpdate(
          ride.driver,
          {
            $inc: { "wallet.balance": -penaltyAmount },
            $push: { "wallet.transactions": penaltyTransaction._id },
          },
          { session }
        );
      }
    } else {
      // No penalties - refund commitment fees
      const refundTransactions = [];

      // Refund passenger
      const passengerRefund = new Transaction({
        type: "REFUND",
        amount: ride.commitmentFee,
        description: `Full refund (100%) for cancelled ride ${ride._id}`,
        rideId: ride._id,
        userId: ride.passenger,
      });
      await passengerRefund.save({ session });
      refundTransactions.push(passengerRefund);

      // Add the transaction to the ride's transactions array
      ride.transactions.push(passengerRefund._id);

      await User.findByIdAndUpdate(
        ride.passenger,
        {
          $inc: { "wallet.balance": ride.commitmentFee },
          $push: { "wallet.transactions": passengerRefund._id },
        },
        { session }
      );

      // Refund driver if exists
      if (ride.driver) {
        const driverRefund = new Transaction({
          type: "REFUND",
          amount: ride.commitmentFee,
          description: `Full refund (100%) for cancelled ride ${ride._id}`,
          rideId: ride._id,
          userId: ride.driver,
        });
        await driverRefund.save({ session });
        refundTransactions.push(driverRefund);

        // Add the transaction to the ride's transactions array
        ride.transactions.push(driverRefund._id);

        await User.findByIdAndUpdate(
          ride.driver,
          {
            $inc: { "wallet.balance": ride.commitmentFee },
            $push: { "wallet.transactions": driverRefund._id },
          },
          { session }
        );
      }
    }

    await ride.save({ session });
    await session.commitTransaction();

    res.json({
      message: "Ride cancelled successfully",
      penalties,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error cancelling ride:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    session.endSession();
  }
});

// Remove the simulation route
module.exports = router;
