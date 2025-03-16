const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    bookingType: {
      type: String,
      enum: ["POINT_TO_POINT", "HOURLY"],
      required: true,
    },
    pickup: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: function () {
        return this.bookingType === "POINT_TO_POINT";
      },
    },
    distance: {
      type: Number, // in kilometers
      required: function () {
        return this.bookingType === "POINT_TO_POINT";
      },
    },
    hours: {
      type: Number,
      required: function () {
        return this.bookingType === "HOURLY";
      },
    },
    fare: {
      type: Number,
      required: true,
      default: function () {
        if (this.bookingType === "POINT_TO_POINT") {
          return Number(this.distance) * 20; // ₹20 per kilometer
        } else {
          return Number(this.hours) * 250; // ₹250 per hour
        }
      },
    },
    estimatedFare: {
      type: Number,
      required: true,
      default: function () {
        return Number(this.fare);
      },
    },
    commitmentFee: {
      type: Number,
      required: true,
      default: function () {
        return Math.round(Number(this.fare) * 0.2); // 20% of fare
      },
    },
    duration: {
      type: Number, // in minutes
      required: true,
      default: 30,
    },
    scheduledTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
    passengerCommitment: {
      amount: {
        type: Number,
        required: true,
        default: 0,
      },
      status: {
        type: String,
        enum: ["pending", "paid", "refunded", "forfeited"],
        default: "pending",
      },
    },
    driverCommitment: {
      amount: {
        type: Number,
        required: true,
        default: 0,
      },
      status: {
        type: String,
        enum: ["pending", "paid", "refunded", "forfeited"],
        default: "pending",
      },
    },
    cancellationDetails: {
      cancelledBy: {
        type: String,
        enum: ["passenger", "driver"],
      },
      cancelledAt: Date,
      reason: String,
      penaltyAmount: Number,
      platformCommission: Number,
      passengerRefundAmount: Number,
      driverRefundAmount: Number,
      passengerConvenienceFee: Number,
      driverConvenienceFee: Number,
      platformFeePercentage: Number,
      convenienceFeePercentage: Number,
    },
    platformCommission: {
      type: Number,
      default: 0,
    },
    driverBonus: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.fare = Number(ret.fare);
        ret.estimatedFare = Number(ret.estimatedFare);
        ret.commitmentFee = Number(ret.commitmentFee);
        ret.passengerCommitment.amount = Number(ret.passengerCommitment.amount);
        ret.driverCommitment.amount = Number(ret.driverCommitment.amount);
        ret.platformCommission = Number(ret.platformCommission);
        ret.driverBonus = Number(ret.driverBonus || 0);
        return ret;
      },
    },
  }
);

// Calculate commitment fees before saving
rideSchema.pre("save", function (next) {
  if (this.isNew) {
    // Calculate commitment fee as 20% of estimated fare
    const commitmentFeePercentage = 0.2;
    this.commitmentFee = Math.round(
      Number(this.estimatedFare) * commitmentFeePercentage
    );

    // Set passenger and driver commitment amounts
    this.passengerCommitment.amount = this.commitmentFee;
    this.driverCommitment.amount = this.commitmentFee;
  }
  next();
});

// Get platform fee percentage - can be overridden by environment variable
rideSchema.statics.getPlatformFeePercentage = function () {
  return process.env.PLATFORM_FEE_PERCENTAGE
    ? parseFloat(process.env.PLATFORM_FEE_PERCENTAGE)
    : 0.1; // Default 10%
};

// Get convenience fee percentage - can be overridden by environment variable
rideSchema.statics.getConvenienceFeePercentage = function () {
  return process.env.CONVENIENCE_FEE_PERCENTAGE
    ? parseFloat(process.env.CONVENIENCE_FEE_PERCENTAGE)
    : 0.9; // Default 90%
};

// Calculate cancellation penalties
rideSchema.methods.calculateCancellationPenalties = function (cancelledBy) {
  // Default to passenger if cancelledBy is not provided
  cancelledBy = cancelledBy || "passenger";

  // If passenger is cancelling and no driver has accepted yet, provide full refund
  if (cancelledBy === "passenger" && !this.driver) {
    return {
      penaltyAmount: 0,
      platformAmount: 0,
      convenienceFee: 0,
      passengerRefundAmount: this.commitmentFee || 0,
      driverRefundAmount: 0,
      passengerConvenienceFee: 0,
      driverConvenienceFee: 0,
      timeThreshold: 0,
      minutesUntilRide: 0,
      platformFeePercentage: 0.1, // Hardcoded 10%
      convenienceFeePercentage: 0.9, // Hardcoded 90%
    };
  }

  const now = new Date();
  const scheduledTime = new Date(this.scheduledTime);
  const bookTime = new Date(this.createdAt);

  // Calculate time differences in milliseconds
  const scheduledToBookTimeDiff = scheduledTime - bookTime;
  const bookToCurrentTimeDiff = now - bookTime;

  // Calculate minutes until ride for display purposes
  const minutesUntilRide = Math.max(0, (scheduledTime - now) / (1000 * 60));

  // If time until ride is 0 minutes or less, apply full penalty
  if (minutesUntilRide <= 0) {
    // Full penalty - no refund
    const commitmentAmount = this.commitmentFee || 0;
    const platformFeePercentage = 0.1; // Hardcoded 10%
    const convenienceFeePercentage = 0.9; // Hardcoded 90%
    const penaltyAmount = commitmentAmount;
    // Use exact calculation without rounding
    const platformAmount = penaltyAmount * platformFeePercentage;
    const convenienceFee = penaltyAmount * convenienceFeePercentage;

    let passengerRefundAmount = 0;
    let driverRefundAmount = 0;
    let passengerConvenienceFee = 0;
    let driverConvenienceFee = 0;

    if (cancelledBy === "passenger") {
      if (this.status === "ACCEPTED") {
        driverConvenienceFee = convenienceFee;
      }
    } else if (cancelledBy === "driver" && this.status === "ACCEPTED") {
      passengerConvenienceFee = convenienceFee;
    }

    return {
      penaltyAmount,
      platformAmount,
      convenienceFee,
      passengerRefundAmount,
      driverRefundAmount,
      passengerConvenienceFee,
      driverConvenienceFee,
      timeThreshold: 1, // Full penalty
      minutesUntilRide: 0,
      platformFeePercentage,
      convenienceFeePercentage,
      refundRatio: 0,
      scheduledToBookTimeDiff,
      bookToCurrentTimeDiff,
    };
  }

  // Implement the exponential refund algorithm
  // Fee Refunded = e^k × (Scheduled Ride Time - Book Time) / (Book Time - Current Time of Cancellation)
  // where k is -2
  const k = -2; // Hardcoded k value
  const commitmentAmount = this.commitmentFee || 0; // Same for both passenger and driver

  // Prevent division by zero or negative values
  let refundRatio = 0;
  if (bookToCurrentTimeDiff > 0) {
    refundRatio =
      Math.exp(k) * (scheduledToBookTimeDiff / bookToCurrentTimeDiff);
    // Clamp the ratio between 0 and 1
    refundRatio = Math.max(0, Math.min(1, refundRatio));
  }

  // For drivers, ensure there's always at least a small penalty unless it's very early
  // This prevents the "full refund" message from showing incorrectly
  if (cancelledBy === "driver" && minutesUntilRide > 0) {
    // Ensure refund ratio is never exactly 1 for drivers (unless it's very early)
    // The further from the ride time, the smaller the minimum penalty
    const timeFactorForDriver = Math.min(1, 60 / Math.max(1, minutesUntilRide));
    const minPenaltyRatio = 0.05 * timeFactorForDriver; // At least 5% penalty, scaled by time
    refundRatio = Math.min(refundRatio, 1 - minPenaltyRatio);
  }

  // For passengers, also ensure there's at least a minimal penalty if a driver has accepted
  if (cancelledBy === "passenger" && this.driver && minutesUntilRide > 0) {
    // Smaller minimum penalty for passengers, but still ensure it's not zero
    const timeFactorForPassenger = Math.min(
      1,
      30 / Math.max(1, minutesUntilRide)
    );
    const minPenaltyRatio = 0.02 * timeFactorForPassenger; // At least 2% penalty, scaled by time
    refundRatio = Math.min(refundRatio, 1 - minPenaltyRatio);
  }

  // Calculate refund amount based on the ratio
  let refundAmount = commitmentAmount * refundRatio;

  // Apply multiplier for passenger refunds - passengers get penalized more
  if (cancelledBy === "passenger") {
    refundAmount = refundAmount * 0.9; // Hardcoded 0.9 multiplier (10% less refund for passengers)
    // Ensure refund doesn't exceed commitment amount
    refundAmount = Math.min(refundAmount, commitmentAmount);
  } else if (cancelledBy === "driver") {
    // Drivers get a bonus on their refund
    refundAmount = refundAmount * 1.1; // Hardcoded 1.1 multiplier (10% more refund for drivers)
    // Ensure refund doesn't exceed commitment amount
    refundAmount = Math.min(refundAmount, commitmentAmount);
  }

  // Calculate penalty amount (amount not refunded)
  const penaltyAmount = commitmentAmount - refundAmount;

  // Platform takes 10% commission of the penalty amount
  const platformFeePercentage = 0.1; // Hardcoded 10%
  // Use exact calculation without rounding
  const platformAmount = penaltyAmount * platformFeePercentage;

  // The remaining penalty goes to the affected party as convenience fee
  const convenienceFeePercentage = 0.9; // Hardcoded 90%
  // Use exact calculation without rounding
  const convenienceFee = penaltyAmount * convenienceFeePercentage;

  // Calculate refund amounts based on who is cancelling and ride status
  let passengerRefundAmount = 0;
  let driverRefundAmount = 0;
  let passengerConvenienceFee = 0;
  let driverConvenienceFee = 0;

  if (cancelledBy === "passenger") {
    passengerRefundAmount = refundAmount;
    if (this.status === "ACCEPTED") {
      driverConvenienceFee = convenienceFee;
    }
  } else if (cancelledBy === "driver" && this.status === "ACCEPTED") {
    driverRefundAmount = refundAmount;
    passengerConvenienceFee = convenienceFee;
  }

  // For backward compatibility, calculate a timeThreshold value
  // This is used in the UI to show the penalty level
  let timeThreshold = 1 - refundRatio;

  return {
    penaltyAmount,
    platformAmount,
    convenienceFee,
    passengerRefundAmount,
    driverRefundAmount,
    passengerConvenienceFee,
    driverConvenienceFee,
    timeThreshold,
    minutesUntilRide: Math.floor(minutesUntilRide),
    platformFeePercentage,
    convenienceFeePercentage,
    refundRatio,
    scheduledToBookTimeDiff,
    bookToCurrentTimeDiff,
  };
};

// Get cancellation disclaimer
rideSchema.methods.getCancellationDisclaimer = function (cancelledBy) {
  // Default to passenger if cancelledBy is not provided
  cancelledBy = cancelledBy || "passenger";

  const penalties = this.calculateCancellationPenalties(cancelledBy);
  const bookingType =
    this.bookingType === "POINT_TO_POINT"
      ? `${this.distance}km ride`
      : `${this.hours}-hour booking`;

  let disclaimer = `Cancellation Policy for ${bookingType}:\n\n`;

  disclaimer +=
    "Our dynamic cancellation policy uses an exponential algorithm:\n";
  disclaimer +=
    "• Refund = e^(-2) × (Scheduled Time - Booking Time) / (Current Time - Booking Time)\n";
  disclaimer += "• The closer to the scheduled time, the lower the refund\n";
  disclaimer += "• The longer you wait to cancel, the lower the refund\n";
  disclaimer +=
    "• Full penalty applies at ride time (0 minutes until ride)\n\n";

  disclaimer += "Penalty Distribution:\n";
  disclaimer +=
    "• 90% of penalty amount goes to affected party as compensation\n";
  disclaimer += "• 10% of penalty amount goes to platform as service fee\n\n";

  // Always show the refund calculation details, even for very small penalty amounts
  disclaimer += `Current Refund Status (${penalties.minutesUntilRide} minutes until ride):\n`;
  disclaimer += `• Refund Ratio: ${(penalties.refundRatio * 100).toFixed(
    2
  )}%\n`;

  // Only show a full refund message if the passenger is cancelling and no driver has accepted
  if (!this.driver && cancelledBy === "passenger") {
    disclaimer += "Based on our algorithm, you will receive a full refund\n";
  } else {
    // Always show penalty details, even for very small amounts
    disclaimer += `• Penalty Amount: ₹${penalties.penaltyAmount.toFixed(4)}\n`;
    disclaimer += `• Platform fee: ₹${penalties.platformAmount.toFixed(4)}\n`;

    if (cancelledBy === "passenger") {
      disclaimer += `• Refund Amount: ₹${penalties.passengerRefundAmount.toFixed(
        4
      )}\n`;
    } else {
      disclaimer += `• Refund Amount: ₹${penalties.driverRefundAmount.toFixed(
        4
      )}\n`;
    }
  }

  return disclaimer;
};

// Ensure all monetary values are numbers before saving
rideSchema.pre("save", function (next) {
  this.fare = Number(this.fare);
  this.estimatedFare = Number(this.estimatedFare);
  this.commitmentFee = Number(this.commitmentFee);
  this.passengerCommitment.amount = Number(this.passengerCommitment.amount);
  this.driverCommitment.amount = Number(this.driverCommitment.amount);
  this.platformCommission = Number(this.platformCommission);
  this.driverBonus = Number(this.driverBonus || 0);
  next();
});

module.exports = mongoose.model("Ride", rideSchema);
