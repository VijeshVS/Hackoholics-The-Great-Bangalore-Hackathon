const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['passenger', 'driver'],
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  wallet: {
    balance: {
      type: Number,
      required: true,
      default: 10000
    },
    transactions: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
      }],
      default: []
    }
  },
  rating: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Convert wallet.balance to wallet for API consistency
      if (ret.wallet && typeof ret.wallet.balance === 'number') {
        const transactions = ret.wallet.transactions;
        ret.wallet = Number(ret.wallet.balance);
        ret.transactions = transactions;
      } else if (ret.wallet && ret.wallet.balance === undefined && typeof ret.wallet === 'number') {
        // Handle case where wallet is already transformed
        ret.wallet = Number(ret.wallet);
      } else {
        ret.wallet = 0;
      }
      return ret;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Initialize wallet if it doesn't exist
userSchema.pre('save', function(next) {
  if (!this.wallet) {
    this.wallet = {
      balance: 10000,
      transactions: []
    };
  }
  if (!this.wallet.transactions) {
    this.wallet.transactions = [];
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
