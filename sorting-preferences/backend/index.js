const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createServer } = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
require("dotenv").config();

// Load env vars
dotenv.config();

const app = express();
const httpServer = createServer(app);
const cancelAreaFilePath = path.join(__dirname, "cancel_area.csv");
const cancelAreas = [];

fs.createReadStream(cancelAreaFilePath)
  .pipe(csv())
  .on("data", (row) => {
    cancelAreas.push(row);
  })
  .on("end", () => {
    console.log("CSV file successfully processed");
});

// Function to calculate distance using Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {

  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Radius of Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function isHighCancellationNearby(userLat, userLong, thresholdDistance = 1) {
  for (const ward of cancelAreas) {
    const distance = getDistance(userLat, userLong, ward.lat, ward.long);
    const cancellationRate = parseFloat(ward["Booking Cancellation Rate"].replace('%', '')); // Remove % and parse

    if (distance <= thresholdDistance && cancellationRate >= 30) {
      return true;
    }
  }
  return false;
}

// Enable CORS for Express (Allow Any Origin)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

// Enable CORS for Socket.IO (Allow Any Origin)
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow requests from any origin
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinDriverRoom", (driverId) => {
    socket.join(`driver_${driverId}`);
  });

  socket.on("pickup_changed", (msg) => {
    const parsedMsg = JSON.parse(msg);
    const { lat,lng } = parsedMsg;
    const near = isHighCancellationNearby(lat, lng);
    socket.emit("pickup_changed", JSON.stringify({ near: near }));
  });

  socket.on("rideBooked",(data)=>{
    console.log(data)
  })

  socket.on("joinPassengerRoom", (rideId) => {
    socket.join(`ride_${rideId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

  socket.on("demand_check",(data)=>{
    const parsedMsg = JSON.parse(data);
    const [lat,lng] = parsedMsg.ride.pickup.split(",");
    const trimmedLong = lng.trim();
    const near = isHighCancellationNearby(lat, trimmedLong);
    
    socket.emit('high_demand_booked', JSON.stringify({ near: near }));
  })

});


app.post("/get-travel-time", async (req, res) => {
  const { startLat, startLng, endLat, endLng, mode = "driving" } = req.body;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${startLat},${startLng}&destinations=${endLat},${endLng}&mode=${mode}&departure_time=now&traffic_model=best_guess&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log(data)

    if (data.status === "OK" && data.rows.length > 0 && data.rows[0].elements[0].status === "OK") {
      const duration = data.rows[0].elements[0].duration_in_traffic;
      res.json({ estimatedTime: duration.text });
    } else {
      res.status(400).json({ error: "Invalid response from API" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching travel time" });
  }
});

// Make io accessible to route handlers
app.set("io", io);

// Routes
app.use("/api/drivers", require("./routes/driverRoutes"));
app.use("/api/rides", require("./routes/rideRoutes"));

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000 ;

// Start server
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
