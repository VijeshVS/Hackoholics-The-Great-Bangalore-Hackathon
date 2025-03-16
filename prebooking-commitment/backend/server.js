require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const Transaction = require('./models/Transaction');
const Ride = require('./models/Ride');
const User = require('./models/User');
const PlatformCommission = require('./models/PlatformCommission');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Handle ride status updates
  socket.on('rideStatusUpdate', (data) => {
    io.emit('rideStatusChanged', data);
  });

  // Handle ride cancellations
  socket.on('rideCancelled', (data) => {
    io.emit('rideStatusChanged', {
      rideId: data.rideId,
      status: 'CANCELLED',
      cancelledBy: data.cancelledBy
    });
  });
});

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));

// Add cancellation routes - keeping them under /api/rides since they're ride-related
app.use('/api/rides', require('./routes/cancellations'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
