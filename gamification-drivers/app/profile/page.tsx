"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Car, Trophy, Star, Coins, Gift, Check, Clock } from "lucide-react";
import { useRideStore } from "../store/rideStore";
import { useUserStore } from "../store/userStore";
import { motion } from "framer-motion";

interface PurchasedReward {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  purchaseDate: string;
}

export default function ProfilePage() {
  // Get global variables from stores
  const { totalRides, totalEarnings } = useRideStore();
  const { totalCoins, currentLevel, currentTier, driverScore } = useUserStore();
  // State for purchased rewards
  const [purchasedRewards, setPurchasedRewards] = useState<PurchasedReward[]>([]);
  
  // Load purchased rewards from localStorage
  useEffect(() => {
    try {
      const savedRewards = JSON.parse(localStorage.getItem('purchasedRewards') || '[]');
      setPurchasedRewards(savedRewards);
    } catch (error) {
      console.error("Error loading purchased rewards:", error);
    }
  }, []);
  
  // Mock data - in a real app, this would come from an API
  const driverData = {
    name: "Vaibhav P R ",
    image: "https://i.ibb.co/Zzjqq0rk/d.png",
    phone: "+91 98765 43210",
    email: "vaibhav.driver@example.com",
    achievements: [
      { title: "1000 Rides Completed", date: "2024-12-01" },
      { title: "Top Driver - December 2024", date: "2024-12-31" },
      { title: "Perfect 5-Star Week", date: "2025-01-15" }
    ]
  };

  // Format earnings for display
  const formattedTotalEarnings = `₹${totalEarnings.toLocaleString()}`;
  const thisMonthEarnings = "₹15,000"; // Still mock data for monthly earnings
  const lastMonthEarnings = "₹12,000"; // Still mock data for monthly earnings

  // Driver star rating value
  const driverStarRating = 4.2;
  const driverStarPercentage = (driverStarRating / 5) * 100;

  // Function to get the icon component based on string name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Fuel':
        return <Car className="w-5 h-5 text-primary" />;
      case 'Car':
        return <Car className="w-5 h-5 text-primary" />;
      case 'Phone':
        return <Phone className="w-5 h-5 text-primary" />;
      case 'Gift':
        return <Gift className="w-5 h-5 text-primary" />;
      default:
        return <Gift className="w-5 h-5 text-primary" />;
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl animate-in fade-in duration-500">
      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-6">
        <Avatar className="w-24 h-24 border-4 border-primary/20">
          <AvatarImage src={driverData.image} />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{driverData.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Star className="w-4 h-4 mr-1" />
              {currentTier.name} Tier
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Trophy className="w-4 h-4 mr-1" />
              Level {currentLevel}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              {driverData.phone}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              {driverData.email}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold">{totalRides}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Driver Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold">{driverStarRating}</span>
            </div>
            <div className="w-full h-2 bg-primary/20 rounded-full mt-2">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${driverStarPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold">{formattedTotalEarnings}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This Month: {thisMonthEarnings}
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Coins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-xl font-bold">{totalCoins.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Use in Rewards Shop
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Rewards Section */}
      {purchasedRewards.length > 0 && (
        <div className="mt-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">My Rewards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {purchasedRewards.map((reward, index) => (
              <motion.div
                key={reward.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        <Check className="w-3 h-3 mr-1" /> Active
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      {getIconComponent(reward.icon)}
                      <CardTitle className="text-base">{reward.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">{reward.description}</p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-primary/10 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Purchased: {formatDate(reward.purchaseDate)}</span>
                      </div>
                      <div className="flex items-center">
                        <Coins className="w-3 h-3 mr-1" />
                        <span>{reward.cost}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}