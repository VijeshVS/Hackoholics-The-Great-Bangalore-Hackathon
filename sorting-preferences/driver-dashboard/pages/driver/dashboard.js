import { useEffect, useState } from 'react';
import { driverAPI, rideAPI } from '../../services/api';
import { getSocket, joinDriverRoom } from '../../services/socketService';

export default function DriverDashboard() {
  const [drivers, setDrivers] = useState([]);
  const [rideRequests, setRideRequests] = useState([]);
  const [newDriver, setNewDriver] = useState({
    name: '',
  });
  const [sortCriteria, setSortCriteria] = useState({});

  useEffect(() => {
    const socket = getSocket();
    loadDrivers();
    loadPendingRides();

    socket.on('newRideRequest', (ride) => {
      setRideRequests(prev => [ride, ...prev]);
    });

    socket.on('rideStatusUpdated', (updatedRide) => {
      setRideRequests(prev => 
        prev.map(ride => 
          ride._id === updatedRide._id ? updatedRide : ride
        )
      );
    });

    return () => {
      socket.off('newRideRequest');
      socket.off('rideStatusUpdated');
    };
  }, []);

  const loadDrivers = async () => {
    try {
      const data = await driverAPI.getAllDrivers();
      setDrivers(data);
      data.forEach(driver => {
        setSortCriteria(prev => ({
          ...prev,
          [driver._id]: 'none'
        }));
        joinDriverRoom(driver._id);
      });
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const loadPendingRides = async () => {
    try {
      const data = await rideAPI.getPendingRides();
      setRideRequests(data);
    } catch (error) {
      console.error('Error loading rides:', error);
    }
  };

  const addDriver = async () => {
    if (!newDriver.name) return;

    try {
      const data = await driverAPI.addDriver(newDriver);
      setDrivers(prev => [...prev, data]);
      setSortCriteria(prev => ({
        ...prev,
        [data._id]: 'none'
      }));
      joinDriverRoom(data._id);
      setNewDriver({ name: '' });
    } catch (error) {
      console.error('Error adding driver:', error);
    }
  };

  const deleteDriver = async (driverId) => {
    try {
      await driverAPI.deleteDriver(driverId);
      setDrivers(prev => prev.filter(driver => driver._id !== driverId));
      setSortCriteria(prev => {
        const newCriteria = { ...prev };
        delete newCriteria[driverId];
        return newCriteria;
      });
    } catch (error) {
      console.error('Error deleting driver:', error);
    }
  };

  const acceptRide = async (rideId, driverId) => {
    try {
      const data = await rideAPI.acceptRide(rideId, driverId);
      if (data.ride && data.driver) {
        // Remove the accepted ride from the pending rides list
        setRideRequests(prev =>
          prev.filter(ride => ride._id !== rideId)
        );
        // Update the driver's status
        setDrivers(prev =>
          prev.map(driver =>
            driver._id === driverId ? data.driver : driver
          )
        );
      }
    } catch (error) {
      console.error('Error accepting ride:', error);
      alert('Failed to accept ride. Please try again.');
    }
  };

  const rejectRide = async (rideId, driverId) => {
    try {
      const data = await rideAPI.rejectRide(rideId, driverId);
      setRideRequests(prev =>
        prev.map(ride =>
          ride._id === rideId ? data : ride
        )
      );
    } catch (error) {
      console.error('Error rejecting ride:', error);
    }
  };

  const handleSort = (driverId, criteria) => {
    setSortCriteria(prev => ({
      ...prev,
      [driverId]: criteria
    }));
  };

  const getSortedRides = (rides, criteria) => {
    if (criteria === 'none') return rides;
    
    return [...rides].sort((a, b) => {
      switch (criteria) {
        case 'time':
          return a.pickupTime - b.pickupTime;
        case 'fare':
          return parseFloat(b.fare) - parseFloat(a.fare);
        case 'distance':
          return parseFloat(a.distance) - parseFloat(b.distance);
        default:
          return 0;
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Driver Management</h1>
        
        {/* Add Driver Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Driver</h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Driver Name"
              value={newDriver.name}
              onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={addDriver}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Add Driver
            </button>
          </div>
        </div>

        {/* Driver Cards with Ride Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map(driver => (
            <div key={driver._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">{driver.name}</h3>
                  <span className={`px-2 py-1 rounded text-sm ${driver.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {driver.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={sortCriteria[driver._id] || 'none'}
                    onChange={(e) => handleSort(driver._id, e.target.value)}
                    className="text-sm border rounded px-2 py-1 bg-white"
                  >
                    <option value="none">Sort by...</option>
                    <option value="time">Ride duration</option>
                    <option value="fare">Fare (High to Low)</option>
                    <option value="distance">Distance (Low to High)</option>
                  </select>
                  <button
                    onClick={() => deleteDriver(driver._id)}
                    className="text-sm px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {getSortedRides(rideRequests.filter(ride => ride.status === 'pending'), sortCriteria[driver._id]).map(ride => (
                  <div key={ride._id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Ride #{ride._id}</h4>
                        <p className="text-sm text-gray-600">
                          From: {ride.pickup}<br />
                          To: {ride.dropoff}<br />
                          Ride duration: {ride.pickupTime} min
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium text-green-600">₹{ride.fare}</p>
                        <p className="text-gray-600">{ride.distance}km</p>
                        
                      </div>
                    </div>
                    {!ride.rejectedBy?.includes(driver._id) && driver.status === 'available' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => acceptRide(ride._id, driver._id)}
                          className="flex-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => rejectRide(ride._id, driver._id)}
                          className="flex-1 bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {rideRequests.filter(ride => ride.status === 'pending').length === 0 && (
                  <p className="text-gray-500 text-center text-sm">No pending ride requests</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {drivers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No drivers added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
