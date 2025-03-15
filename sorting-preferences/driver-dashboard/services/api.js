const API_BASE_URL = 'http://localhost:4000/api';

// Driver API calls
export const driverAPI = {
  getAllDrivers: async () => {
    const response = await fetch(`${API_BASE_URL}/drivers`);
    return response.json();
  },

  addDriver: async (driverData) => {
    const response = await fetch(`${API_BASE_URL}/drivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(driverData),
    });
    return response.json();
  },

  updatePreferences: async (driverId, preferences) => {
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });
    return response.json();
  },

  updateStatus: async (driverId, status) => {
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },

  deleteDriver: async (driverId) => {
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Ride API calls
export const rideAPI = {
  getAllRides: async () => {
    const response = await fetch(`${API_BASE_URL}/rides`);
    return response.json();
  },

  getPendingRides: async () => {
    const response = await fetch(`${API_BASE_URL}/rides/pending`);
    return response.json();
  },

  createRide: async (rideData) => {
    const response = await fetch(`${API_BASE_URL}/rides`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rideData),
    });
    return response.json();
  },

  acceptRide: async (rideId, driverId) => {
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}/accept`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ driverId }),
    });
    return response.json();
  },

  rejectRide: async (rideId, driverId) => {
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ driverId }),
    });
    return response.json();
  },

  completeRide: async (rideId) => {
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },
};
