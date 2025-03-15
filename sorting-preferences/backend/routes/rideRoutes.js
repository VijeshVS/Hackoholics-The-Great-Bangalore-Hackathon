const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');

// Get all rides
router.get('/', async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate('driver', 'name status')
      .populate('rejectedBy', 'name');
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pending rides
router.get('/pending', async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'pending' })
      .populate('rejectedBy', 'name');
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new ride request
router.post('/', async (req, res) => {
  const ride = new Ride({
    pickup: req.body.pickup,
    dropoff: req.body.dropoff,
    distance: req.body.distance,
    fare: req.body.fare,
    pickupTime: req.body.pickupTime
  });

  try {
    const newRide = await ride.save();
    
    // Find matching drivers based on preferences
    const matchingDrivers = await Driver.find({
      status: 'available',
      'preferences.maxTripDistance': { $gte: req.body.distance },
      'preferences.minimumFare': { $lte: req.body.fare },
      'preferences.maxPickupTime': { $gte: req.body.pickupTime }
    });

    // Emit event for matching drivers (will be implemented with Socket.IO)
    
    res.status(201).json({
      ride: newRide,
      matchingDrivers: matchingDrivers.map(d => d._id)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Accept a ride
router.put('/:id/accept', async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const driver = await Driver.findById(req.body.driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Check if ride is still available
    if (ride.status !== 'pending') {
      return res.status(400).json({ message: 'Ride is no longer available' });
    }

    // Update ride status and assign driver
    ride.status = 'accepted';
    ride.driver = driver._id;
    await ride.save();

    // Update driver status
    driver.status = 'busy';
    driver.currentRide = ride._id;
    await driver.save();

    res.json({ ride, driver });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Reject a ride
router.put('/:id/reject', async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Add driver to rejected list if not already there
    if (!ride.rejectedBy.includes(req.body.driverId)) {
      ride.rejectedBy.push(req.body.driverId);
      await ride.save();
    }

    res.json(ride);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Complete a ride
router.put('/:id/complete', async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'accepted') {
      return res.status(400).json({ message: 'Ride is not in progress' });
    }

    // Update ride status
    ride.status = 'completed';
    await ride.save();

    // Free up the driver
    const driver = await Driver.findById(ride.driver);
    if (driver) {
      driver.status = 'available';
      driver.currentRide = null;
      await driver.save();
    }

    res.json({ ride, driver });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
