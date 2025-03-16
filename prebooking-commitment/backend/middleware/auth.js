const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No auth token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Convert wallet.balance to wallet for API consistency
    const userObj = user.toObject();
    userObj.wallet = Number((userObj.wallet && userObj.wallet.balance) || 0);
    if (userObj.wallet.balance) delete userObj.wallet.balance;
    if (userObj.wallet.transactions) delete userObj.wallet.transactions;
    req.user = userObj;

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Please authenticate' });
  }
};

module.exports = auth;
