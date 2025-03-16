const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with initial balance
    user = new User({
      name,
      email,
      password,
      role,
      phoneNumber,
      wallet: {
        balance: 10000,
        transactions: []
      }
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create and return token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Convert wallet.balance to wallet for API consistency
    const userObj = user.toObject();
    userObj.wallet = Number((userObj.wallet && userObj.wallet.balance) || 0);
    if (userObj.wallet.balance) delete userObj.wallet.balance;
    if (userObj.wallet.transactions) delete userObj.wallet.transactions;

    res.status(201).json({
      token,
      user: {
        _id: userObj._id,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role,
        phoneNumber: userObj.phoneNumber,
        wallet: userObj.wallet
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create and return token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Convert wallet.balance to wallet for API consistency
    const userObj = user.toObject();
    userObj.wallet = Number((userObj.wallet && userObj.wallet.balance) || 0);
    if (userObj.wallet.balance) delete userObj.wallet.balance;
    if (userObj.wallet.transactions) delete userObj.wallet.transactions;

    res.json({
      token,
      user: {
        _id: userObj._id,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role,
        phoneNumber: userObj.phoneNumber,
        wallet: userObj.wallet
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Convert wallet.balance to wallet for API consistency
    const userObj = user.toObject();
    userObj.wallet = Number((userObj.wallet && userObj.wallet.balance) || 0);
    if (userObj.wallet.balance) delete userObj.wallet.balance;
    if (userObj.wallet.transactions) delete userObj.wallet.transactions;

    res.json(userObj);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update wallet balance
router.put('/wallet', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, type } = req.body;

    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.user._id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize wallet if it doesn't exist
    if (!user.wallet) {
      user.wallet = {
        balance: 0,
        transactions: []
      };
    }

    // Ensure wallet.balance is a number
    if (typeof user.wallet.balance !== 'number') {
      user.wallet.balance = 0;
    }

    if (type === 'ADD') {
      user.wallet.balance = Number(user.wallet.balance) + Number(amount);
    } else if (type === 'SUBTRACT') {
      if (user.wallet.balance < amount) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      user.wallet.balance = Number(user.wallet.balance) - Number(amount);
    } else {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid operation type' });
    }

    await user.save({ session });
    await session.commitTransaction();

    // Convert wallet.balance to wallet for API consistency
    const userObj = user.toObject();
    userObj.wallet = Number((userObj.wallet && userObj.wallet.balance) || 0);
    if (userObj.wallet.balance) delete userObj.wallet.balance;
    if (userObj.wallet.transactions) delete userObj.wallet.transactions;

    res.json({
      wallet: userObj.wallet
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Update wallet error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    session.endSession();
  }
});

module.exports = router;
