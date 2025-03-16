const mongoose = require('mongoose');

const platformCommissionSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['CANCELLATION', 'RIDE_COMMISSION'],
    required: true
  },
  source: {
    type: String,
    enum: ['PASSENGER', 'DRIVER'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PlatformCommission', platformCommissionSchema);
