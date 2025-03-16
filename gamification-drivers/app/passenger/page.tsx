"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Clock, IndianRupee, Car, Route } from "lucide-react";
import { useRideStore, type Passenger } from '../store/rideStore';
import { useToast } from "../components/ui/use-toast";

export default function PassengerPage() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fareEstimate, setFareEstimate] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [showSearchingAnimation, setShowSearchingAnimation] = useState(false);
  const [calculatingFare, setCalculatingFare] = useState(false);
  
  const { addRideRequest } = useRideStore();
  const { toast } = useToast();

  const mockPassenger: Passenger = {
    name: "Vaibhav P R",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vaibhav",
    rating: 4.8,
    trips: 42
  };

  const calculateFare = (distance: number) => {
    // Base fare in rupees
    const baseRate = 50; 
    // Rate per kilometer
    const perKmRate = 15; 
    return baseRate + (distance * perKmRate);
  };

  const estimateDistance = (from: string, to: string) => {
    // Generate a random distance between 7-14 km
    return Math.round((Math.random() * 7 + 7) * 10) / 10;
  };

  const estimateDuration = (distance: number) => {
    // Average speed in km/h (assuming city traffic conditions)
    const avgSpeed = 20;
    // Calculate time in minutes
    const timeInMinutes = Math.round((distance / avgSpeed) * 60);
    return `${timeInMinutes} mins`;
  };

  const handleGetEstimate = () => {
    if (!pickup || !dropoff) {
      toast({
        title: "Missing Information",
        description: "Please enter both pickup and dropoff locations",
        variant: "destructive"
      });
      return;
    }

    // Show calculating animation
    setCalculatingFare(true);
    setFareEstimate(null);
    
    // Simulate calculation delay
    setTimeout(() => {
      const estimatedDistance = estimateDistance(pickup, dropoff);
      const estimatedDuration = estimateDuration(estimatedDistance);
      const fare = calculateFare(estimatedDistance);
      
      setDistance(estimatedDistance);
      setDuration(estimatedDuration);
      setFareEstimate(fare);
      setCalculatingFare(false);
    }, 1500);
  };

  const handleBookRide = async () => {
    if (!pickup || !dropoff || !fareEstimate || !distance || !duration) {
      toast({
        title: "Missing Information",
        description: "Please get a fare estimate first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      setShowSearchingAnimation(true);

      const rideRequest = {
        id: Math.random().toString(36).substring(7),
        pickup,
        dropoff,
        passenger: mockPassenger,
        distance: distance + " km",
        duration,
        fare: fareEstimate,
        timestamp: new Date()
      };

      // Simulate network delay
      setTimeout(() => {
        // Add to local store
        addRideRequest(rideRequest);

        toast({
          title: "Ride Booked!",
          description: "Looking for nearby drivers...",
        });

        // Reset form and animations after a delay
        setTimeout(() => {
          setPickup('');
          setDropoff('');
          setFareEstimate(null);
          setDistance(null);
          setDuration(null);
          setShowSearchingAnimation(false);
          setIsLoading(false);
        }, 1000);
      }, 2000);
      
    } catch (error) {
      console.error('Error booking ride:', error);
      toast({
        title: "Error",
        description: "Failed to book ride. Please try again.",
        variant: "destructive"
      });
      setShowSearchingAnimation(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Book a Ride</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <Input
                  placeholder="Pickup Location"
                  value={pickup}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPickup(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" />
                <Input
                  placeholder="Dropoff Location"
                  value={dropoff}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDropoff(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleGetEstimate}
                disabled={!pickup || !dropoff || isLoading || calculatingFare}
              >
                {calculatingFare ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Calculating...
                  </>
                ) : "Get Estimate"}
              </Button>
              <Button
                className="flex-1"
                onClick={handleBookRide}
                disabled={!fareEstimate || isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Booking...
                  </>
                ) : "Book Now"}
              </Button>
            </div>

            <AnimatePresence>
              {calculatingFare && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-secondary/50 rounded-lg p-4 flex items-center justify-center"
                >
                  <div className="text-center">
                    <Route className="h-8 w-8 mx-auto mb-2 animate-pulse text-primary" />
                    <p className="text-sm font-medium">Calculating best route...</p>
                  </div>
                </motion.div>
              )}
              
              {fareEstimate && !calculatingFare && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-secondary/50 rounded-lg p-4 space-y-3"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Distance</p>
                      <p className="text-sm font-semibold">{distance} km</p>
                    </div>
                    <div className="text-center border-x">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-semibold">{duration}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Arrival</p>
                      <p className="text-sm font-semibold">5-8 mins</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Base fare</span>
                      <span>&#8377;50.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Distance charge ({distance} km &#215; &#8377;15/km)</span>
                      <span>&#8377;{(distance! * 15).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total fare</span>
                      <span className="text-lg">&#8377;{fareEstimate.toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {showSearchingAnimation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
                >
                  <div className="bg-card p-6 rounded-xl shadow-lg max-w-md w-full text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <motion.div 
                        className="absolute inset-0 rounded-full bg-primary/20"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2,
                          ease: "easeInOut" 
                        }}
                      />
                      <motion.div 
                        className="absolute inset-2 rounded-full bg-primary/30"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2,
                          delay: 0.3,
                          ease: "easeInOut" 
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Car className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Searching for Drivers</h3>
                    <p className="text-muted-foreground text-sm mb-4">Connecting you with drivers near {pickup}...</p>
                    <div className="flex space-x-1 justify-center">
                      <motion.div 
                        className="w-2 h-2 bg-primary rounded-full"
                        animate={{ y: ["-50%", "50%", "-50%"] }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1,
                          ease: "easeInOut" 
                        }}
                      />
                      <motion.div 
                        className="w-2 h-2 bg-primary rounded-full"
                        animate={{ y: ["-50%", "50%", "-50%"] }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1,
                          delay: 0.2,
                          ease: "easeInOut" 
                        }}
                      />
                      <motion.div 
                        className="w-2 h-2 bg-primary rounded-full"
                        animate={{ y: ["-50%", "50%", "-50%"] }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1,
                          delay: 0.4,
                          ease: "easeInOut" 
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
