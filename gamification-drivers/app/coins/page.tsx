"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Fuel, Car, Phone, Gift } from "lucide-react";

const RewardCard = ({ 
  title, 
  description, 
  cost, 
  icon: Icon 
}: { 
  title: string; 
  description: string; 
  cost: number; 
  icon: any;
}) => (
  <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        <Badge variant="secondary" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Coins className="w-4 h-4 mr-1" />
          {cost}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button className="w-full mt-4" variant="outline">
        Redeem Now
      </Button>
    </CardContent>
  </Card>
);

export default function CoinsPage() {
  const rewards = [
    {
      title: "Petrol Pump Coupon",
      description: "Get ₹100 off on your next fuel refill at any participating petrol pump.",
      cost: 1000,
      icon: Fuel
    },
    {
      title: "Service Center Discount",
      description: "20% off on your next vehicle service at authorized service centers.",
      cost: 2000,
      icon: Car
    },
    {
      title: "Mobile Recharge",
      description: "Get ₹50 off on your next mobile recharge of ₹200 or more.",
      cost: 500,
      icon: Phone
    },
    {
      title: "Special Reward",
      description: "Mystery gift box with exciting rewards and surprises.",
      cost: 3000,
      icon: Gift
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Animated Coin Section */}
      <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-full bg-yellow-500 animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 blur-xl" />
          <Coins className="w-32 h-32 text-yellow-500 animate-bounce" />
        </div>
        <h1 className="text-3xl font-bold mt-6 mb-2">
          You're a top driver!
        </h1>
        <p className="text-muted-foreground mb-4">
          Keep earning more coins with every ride
        </p>
        <div className="inline-flex items-center gap-2 text-4xl font-bold text-primary">
          <Coins className="w-8 h-8" />
          <span className="animate-in slide-in-from-bottom-2 duration-500">
            5,000
          </span>
        </div>
      </div>

      {/* Available Rewards */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Available Rewards</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {rewards.map((reward, index) => (
            <RewardCard
              key={index}
              title={reward.title}
              description={reward.description}
              cost={reward.cost}
              icon={reward.icon}
            />
          ))}
        </div>
      </div>

      {/* How to Earn More */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>How to Earn More Coins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">Complete Rides</h3>
              <p className="text-sm text-muted-foreground">
                Earn 50 coins for every completed ride
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">Maintain Rating</h3>
              <p className="text-sm text-muted-foreground">
                Get 100 bonus coins for maintaining 4.8+ rating
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">Weekly Challenges</h3>
              <p className="text-sm text-muted-foreground">
                Complete challenges to earn up to 500 coins
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
