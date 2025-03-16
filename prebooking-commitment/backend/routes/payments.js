const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Ride = require('../models/Ride');

// Process commitment fee
router.post('/commitment', async (req, res) => {
  try {
    const { rideId, userId, type } = req.body;
    const ride = await Ride.findById(rideId);
    const user = await User.findById(userId);

    if (!ride || !user) {
      return res.status(404).json({ message: 'Ride or user not found' });
    }

    const commitmentAmount = type === 'passenger' 
      ? ride.passengerCommitment.amount 
      : ride.driverCommitment.amount;

    if (user.wallet.balance < commitmentAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create transaction
    const transaction = new Transaction({
      ride: rideId,
      type: 'commitment_fee',
      amount: commitmentAmount,
      from: userId,
      to: 'platform', // Platform holds the commitment fee
      status: 'completed'
    });

    // Update user wallet
    user.wallet.balance -= commitmentAmount;
    user.wallet.transactions.push(transaction._id);

    // Update ride status
    if (type === 'passenger') {
      ride.passengerCommitment.status = 'paid';
    } else {
      ride.driverCommitment.status = 'paid';
    }

    await Promise.all([
      transaction.save(),
      user.save(),
      ride.save()
    ]);

    res.status(201).json({ transaction, remainingBalance: user.wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Process refund
router.post('/refund', async (req, res) => {
  try {
    const { rideId, userId, type } = req.body;
    const ride = await Ride.findById(rideId);
    const user = await User.findById(userId);

    if (!ride || !user) {
      return res.status(404).json({ message: 'Ride or user not found' });
    }

    const refundAmount = type === 'passenger' 
      ? ride.passengerCommitment.amount 
      : ride.driverCommitment.amount;

    // Create refund transaction
    const transaction = new Transaction({
      ride: rideId,
      type: 'refund',
      amount: refundAmount,
      from: 'platform',
      to: userId,
      status: 'completed'
    });

    // Update user wallet
    user.wallet.balance += refundAmount;
    user.wallet.transactions.push(transaction._id);

    await Promise.all([
      transaction.save(),
      user.save()
    ]);

    res.status(201).json({ transaction, newBalance: user.wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transaction history
router.get('/history', async (req, res) => {
  try {
    const { userId, type } = req.query;
    const query = {};

    if (userId) {
      query.$or = [{ from: userId }, { to: userId }];
    }
    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .populate('ride')
      .populate('from', 'name email')
      .populate('to', 'name email')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
