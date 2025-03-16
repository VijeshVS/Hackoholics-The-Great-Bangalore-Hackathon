"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, MapPin, Navigation, Clock, IndianRupee, User, Star, Phone, MapIcon, Car } from "lucide-react";
import { useRideStore, type RideRequest } from '../store/rideStore';
import { useToast } from "../components/ui/use-toast";

export default function DriverPage() {
  const [acceptedRides, setAcceptedRides] = useState<RideRequest[]>([]);
  const [viewMode, setViewMode] = useState<'requests' | 'accepted' | 'completed'>('requests');
  const [showConfetti, setShowConfetti] = useState(false);
  
  const { pendingRequests, removeRideRequest, completedRides, completeRide, totalRides, totalEarnings } = useRideStore();
  const { toast } = useToast();

  // Debug: Log pending requests whenever they change
  useEffect(() => {
    console.log('Current pending requests in driver page:', pendingRequests);
  }, [pendingRequests]);

  const handleAccept = (request: RideRequest) => {
    try {
      console.log('Accepting ride request:', request);
      removeRideRequest(request.id);
      setAcceptedRides(prev => [request, ...prev]);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      toast({
        title: "Ride Accepted",
        description: `You've accepted a ride from ${request.passenger.name}`,
      });
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Error",
        description: "Failed to accept ride. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReject = (request: RideRequest) => {
    try {
      console.log('Rejecting ride request:', request);
      removeRideRequest(request.id);
      
      toast({
        title: "Ride Rejected",
        description: "You've rejected the ride request",
      });
    } catch (error) {
      console.error('Error rejecting ride:', error);
      toast({
        title: "Error",
        description: "Failed to reject ride. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFinishRide = (ride: RideRequest) => {
    try {
      console.log('Finishing ride:', ride);
      setAcceptedRides(prev => prev.filter(r => r.id !== ride.id));
      completeRide(ride);
      
      toast({
        title: "Ride Completed",
        description: `You've completed the ride with ${ride.passenger.name}. Earned ₹${ride.fare}`,
      });
    } catch (error) {
      console.error('Error completing ride:', error);
      toast({
        title: "Error",
        description: "Failed to complete ride. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const dateObj = date instanceof Date ? date : new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} sec ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} min ago`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Driver Dashboard</h1>

          <div className="flex items-center gap-3">
            <Button 
              variant={viewMode === 'requests' ? 'default' : 'outline'} 
              onClick={() => setViewMode('requests')}
            >
              Ride Requests
              {pendingRequests.length > 0 && (
                <Badge className="ml-2" variant="secondary">{pendingRequests.length}</Badge>
              )}
            </Button>
            <Button 
              variant={viewMode === 'accepted' ? 'default' : 'outline'} 
              onClick={() => setViewMode('accepted')}
            >
              Active Rides
              {acceptedRides.length > 0 && (
                <Badge className="ml-2" variant="secondary">{acceptedRides.length}</Badge>
              )}
            </Button>
            <Button 
              variant={viewMode === 'completed' ? 'default' : 'outline'} 
              onClick={() => setViewMode('completed')}
            >
              Completed Rides
              {completedRides.length > 0 && (
                <Badge className="ml-2" variant="secondary">{completedRides.length}</Badge>
              )}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Rides</p>
                  <p className="text-2xl font-bold">{totalRides}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <IndianRupee className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">₹{totalEarnings}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'requests' ? (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <Car className="h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No Pending Requests</h3>
                      <p className="text-sm text-muted-foreground">
                        New ride requests will appear here. Stay tuned!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                pendingRequests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img 
                              src={request.passenger.image} 
                              alt={request.passenger.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs rounded-full px-1">
                              {request.passenger.rating}★
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium">{request.passenger.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {request.passenger.trips} trips
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatTimeAgo(request.timestamp)}
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Pickup</p>
                            <p className="font-medium">{request.pickup}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Navigation className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Dropoff</p>
                            <p className="font-medium">{request.dropoff}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Distance</p>
                            <p className="font-medium">{request.distance}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="font-medium">{request.duration}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Fare</p>
                            <p className="font-medium">₹{request.fare}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleReject(request)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAccept(request)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </motion.div>
          ) : viewMode === 'accepted' ? (
            <motion.div
              key="accepted"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {acceptedRides.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <Car className="h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No Active Rides</h3>
                      <p className="text-sm text-muted-foreground">
                        Your active rides will appear here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                acceptedRides.map((ride) => (
                  <Card key={ride.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img 
                              src={ride.passenger.image} 
                              alt={ride.passenger.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs rounded-full px-1">
                              {ride.passenger.rating}★
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium">{ride.passenger.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {ride.passenger.trips} trips
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-primary/10">Active</Badge>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Pickup</p>
                            <p className="font-medium">{ride.pickup}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Navigation className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Dropoff</p>
                            <p className="font-medium">{ride.dropoff}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Distance</p>
                            <p className="font-medium">{ride.distance}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="font-medium">{ride.duration}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Fare</p>
                            <p className="font-medium">₹{ride.fare}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleFinishRide(ride)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Finish Ride
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="completed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {completedRides.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <Car className="h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No Completed Rides</h3>
                      <p className="text-sm text-muted-foreground">
                        Your completed rides will appear here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                completedRides.map((ride) => (
                  <Card key={ride.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img 
                              src={ride.passenger.image} 
                              alt={ride.passenger.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs rounded-full px-1">
                              {ride.passenger.rating}★
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium">{ride.passenger.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {ride.passenger.trips} trips
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">Completed</Badge>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Pickup</p>
                            <p className="font-medium">{ride.pickup}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Navigation className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Dropoff</p>
                            <p className="font-medium">{ride.dropoff}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Distance</p>
                            <p className="font-medium">{ride.distance}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="font-medium">{ride.duration}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Fare</p>
                            <p className="font-medium">₹{ride.fare}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div 
            className="w-full h-full" 
            style={{ 
              backgroundImage: "url('https://assets.codepen.io/39255/color-burst.gif')", 
              backgroundSize: "cover", 
              backgroundPosition: "center", 
              backgroundRepeat: "no-repeat",
              opacity: 0.7
            }}
          />
        </div>
      )}
    </div>
  );
}
