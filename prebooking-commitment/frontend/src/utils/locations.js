// Sample locations with distances (in kilometers)
export const locations = {
  A: { name: "Location A", coordinates: [0, 0] },
  B: { name: "Location B", coordinates: [3, 4] },
  C: { name: "Location C", coordinates: [6, 8] },
  D: { name: "Location D", coordinates: [-2, 5] },
  E: { name: "Location E", coordinates: [5, -3] },
};

// Calculate distance between two locations using their coordinates
export function calculateDistance(from, to) {
  const [x1, y1] = locations[from].coordinates;
  const [x2, y2] = locations[to].coordinates;

  // Using Euclidean distance formula
  const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  return Number(Math.round(distance)); // Round to nearest kilometer
}

// Calculate fare based on distance or hours
export function calculateFare(type, value) {
  if (type === "distance") {
    // ₹20 per kilometer for point-to-point rides
    return Number(Math.round(Number(value) * 15));
  } else if (type === "hourly") {
    // ₹250 per hour for hourly bookings
    return Number(Math.round(Number(value) * 250));
  }
  return 0;
}

// Get available destinations (excluding the pickup location)
export function getAvailableDestinations(pickup) {
  return Object.keys(locations).filter((loc) => loc !== pickup);
}

// Calculate commitment fee (20% of total fare)
export function calculateCommitmentFee(fare) {
  return Number(Math.round(Number(fare) * 0.2));
}
