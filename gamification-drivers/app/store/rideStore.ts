'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Passenger {
  name: string;
  image: string;
  rating: number;
  trips: number;
}

export interface RideRequest {
  id: string;
  pickup: string;
  dropoff: string;
  passenger: Passenger;
  distance: string;
  duration: string;
  fare: number;
  timestamp: Date;
}

interface RideStore {
  pendingRequests: RideRequest[];
  completedRides: RideRequest[];
  totalRides: number;
  totalEarnings: number;
  addRideRequest: (request: Omit<RideRequest, "timestamp"> & { timestamp: string | Date }) => void;
  removeRideRequest: (id: string) => void;
  completeRide: (ride: RideRequest) => void;
}

export const useRideStore = create<RideStore>()(
  persist(
    (set) => ({
      pendingRequests: [],
      completedRides: [],
      totalRides: 0,
      totalEarnings: 0,
      addRideRequest: (request) => {
        const newRequest = {
          ...request,
          timestamp: request.timestamp instanceof Date ? request.timestamp : new Date(request.timestamp)
        };
        console.log('Adding ride request:', newRequest);
        set((state) => ({
          pendingRequests: [newRequest, ...state.pendingRequests]
        }));
      },
      removeRideRequest: (id) => {
        console.log('Removing ride request:', id);
        set((state) => ({
          pendingRequests: state.pendingRequests.filter(request => request.id !== id)
        }));
      },
      completeRide: (ride: RideRequest) => {
        console.log('Completing ride:', ride);
        // Ensure timestamp is a Date object
        const rideWithValidDate = {
          ...ride,
          timestamp: ride.timestamp instanceof Date ? ride.timestamp : new Date(ride.timestamp)
        };
        set((state) => ({
          completedRides: [rideWithValidDate, ...state.completedRides],
          totalRides: state.totalRides + 1,
          totalEarnings: state.totalEarnings + ride.fare
        }));
      },
    }),
    {
      name: 'ride-store',
      partialize: (state) => ({ 
        pendingRequests: state.pendingRequests,
        completedRides: state.completedRides,
        totalRides: state.totalRides,
        totalEarnings: state.totalEarnings
      }),
    }
  )
);
