const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Ride = require("../models/Ride");
const User = require("../models/User");
const PlatformCommission = require("../models/PlatformCommission");

// Admin middleware
const adminAuth = (req, res, next) => {
  const { email, password } = req.headers;
  if (email === "admin1@gmail.com" && password === "1234") {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// Get all transactions with user details
router.get("/transactions", adminAuth, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("rideId")
      .sort({ timestamp: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get all rides with user details
router.get("/rides", adminAuth, async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate("passenger", "name email")
      .populate("driver", "name email")
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get all platform commissions
router.get("/commissions", adminAuth, async (req, res) => {
  try {
    const commissions = await PlatformCommission.find()
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(commissions);
  } catch (error) {
    console.error("Error fetching commissions:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get dashboard stats
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const [totalTransactions, totalRides, totalUsers, totalCommission] =
      await Promise.all([
        Transaction.countDocuments(),
        Ride.countDocuments(),
        User.countDocuments(),
        PlatformCommission.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ]),
      ]);

    const recentTransactions = await Transaction.find()
      .sort({ timestamp: -1 })
      .limit(5);

    const stats = {
      totalTransactions,
      totalRides,
      totalUsers,
      totalCommission: totalCommission[0]?.total || 0,
      recentTransactions,
      platformFeePercentage: process.env.PLATFORM_FEE_PERCENTAGE || 0.1,
      convenienceFeePercentage: process.env.CONVENIENCE_FEE_PERCENTAGE || 0.9,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update fee percentages
router.post("/update-fees", adminAuth, async (req, res) => {
  try {
    const { platformFeePercentage, convenienceFeePercentage } = req.body;

    // Validate percentages
    if (platformFeePercentage !== undefined) {
      const platformFee = parseFloat(platformFeePercentage);
      if (isNaN(platformFee) || platformFee < 0 || platformFee > 1) {
        return res
          .status(400)
          .json({ error: "Platform fee percentage must be between 0 and 1" });
      }
      process.env.PLATFORM_FEE_PERCENTAGE = platformFee.toString();
    }

    if (convenienceFeePercentage !== undefined) {
      const convenienceFee = parseFloat(convenienceFeePercentage);
      if (isNaN(convenienceFee) || convenienceFee < 0 || convenienceFee > 1) {
        return res.status(400).json({
          error: "Convenience fee percentage must be between 0 and 1",
        });
      }
      process.env.CONVENIENCE_FEE_PERCENTAGE = convenienceFee.toString();
    }

    // Ensure platform fee + convenience fee = 1
    const totalPercentage =
      parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) +
      parseFloat(process.env.CONVENIENCE_FEE_PERCENTAGE);

    if (totalPercentage !== 1) {
      return res.status(400).json({
        error:
          "Platform fee percentage + convenience fee percentage must equal 1",
        platformFeePercentage: process.env.PLATFORM_FEE_PERCENTAGE,
        convenienceFeePercentage: process.env.CONVENIENCE_FEE_PERCENTAGE,
        totalPercentage,
      });
    }

    res.json({
      message: "Fee percentages updated successfully",
      platformFeePercentage: process.env.PLATFORM_FEE_PERCENTAGE,
      convenienceFeePercentage: process.env.CONVENIENCE_FEE_PERCENTAGE,
    });
  } catch (error) {
    console.error("Error updating fee percentages:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
