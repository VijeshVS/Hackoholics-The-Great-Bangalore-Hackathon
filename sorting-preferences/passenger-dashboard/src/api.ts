const API_BASE_URL = 'http://localhost:4000/api';

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

  getTravelTime: async (data:any)=>{
    const response = await fetch(`http://localhost:4000/get-travel-time`,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
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