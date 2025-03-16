"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Fuel, Car, Phone, Gift, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "../store/userStore";
import { motion, AnimatePresence } from "framer-motion";

// Define a coupon type for use in purchasing
interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: any;
}

const RewardCard = ({ 
  reward,
  onPurchase
}: { 
  reward: Reward;
  onPurchase: (reward: Reward) => void;
}) => {
  const { title, description, cost, icon: Icon } = reward;
  const { totalCoins } = useUserStore();
  const canAfford = totalCoins >= cost;
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <Badge variant="secondary" className={`${canAfford ? "group-hover:bg-primary group-hover:text-primary-foreground" : "bg-muted"} transition-colors`}>
            <Coins className="w-4 h-4 mr-1" />
            {cost}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button 
          className="w-full mt-4" 
          variant={canAfford ? "outline" : "secondary"}
          disabled={!canAfford}
          onClick={() => onPurchase(reward)}
        >
          {canAfford ? "Redeem Now" : "Not Enough Coins"}
        </Button>
      </CardContent>
    </Card>
  );
};

const SuccessModal = ({ reward, onClose }: { reward: Reward; onClose: () => void }) => {
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full text-center"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          <motion.div 
            className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5 }}
          >
            <Check className="w-10 h-10 text-green-500" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
            <p className="mb-4 text-muted-foreground">You've successfully purchased the <span className="font-medium text-foreground">{reward.title}</span>!</p>
            
            <div className="p-4 mb-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center text-3xl mb-2">
                {reward.icon && <reward.icon className="w-6 h-6 mr-2 text-primary" />}
                <span className="font-bold">{reward.title}</span>
              </div>
              <p className="text-sm">{reward.description}</p>
            </div>
            
            <div className="flex justify-center gap-2">
              <Button onClick={onClose}>
                View My Rewards
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Define the Lightning Coin component for the updated animation
const LightningCoin = () => {
  return (
    <div className="relative inline-block w-48 h-48">
      {/* Glow effect behind the coin */}
      <div className="w-40 h-40 rounded-full bg-yellow-500 animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 blur-xl" />
      
      {/* The gold coin */}
      <motion.div 
        className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border-4 border-yellow-200"
        animate={{ 
          rotateY: [0, 180, 360],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          repeatType: "loop"
        }}
      >
        {/* Lightning bolt centered on the coin */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-white"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8] 
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatType: "loop"
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
          </svg>
        </motion.div>
      </motion.div>
      
      {/* Particle effects around the coin */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-yellow-300"
          initial={{ 
            x: 0, 
            y: 0,
            opacity: 0
          }}
          animate={{ 
            x: [0, (Math.random() * 100 - 50)], 
            y: [0, (Math.random() * 100 - 50)],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatType: "loop",
            delay: i * 0.3
          }}
          style={{
            top: '50%',
            left: '50%',
          }}
        />
      ))}
    </div>
  );
};

export default function CoinsPage() {
  const { totalCoins, addCoins } = useUserStore();
  const [purchasedReward, setPurchasedReward] = useState<Reward | null>(null);
  const [myRewards, setMyRewards] = useState<Reward[]>([]);
  
  const rewards: Reward[] = [
    {
      id: "fuel-coupon",
      title: "Petrol Pump Coupon",
      description: "Get ₹100 off on your next fuel refill at any participating petrol pump.",
      cost: 1000,
      icon: Fuel
    },
    {
      id: "service-discount",
      title: "Service Center Discount",
      description: "20% off on your next vehicle service at authorized service centers.",
      cost: 2000,
      icon: Car
    },
    {
      id: "mobile-recharge",
      title: "Mobile Recharge",
      description: "Get ₹50 off on your next mobile recharge of ₹200 or more.",
      cost: 500,
      icon: Phone
    },
    {
      id: "mystery-gift",
      title: "Special Reward",
      description: "Mystery gift box with exciting rewards and surprises.",
      cost: 3000,
      icon: Gift
    }
  ];

  const handlePurchase = (reward: Reward) => {
    if (totalCoins >= reward.cost) {
      // Deduct coins
      addCoins(-reward.cost);
      
      // Add to purchased rewards
      setMyRewards([...myRewards, {...reward, id: `${reward.id}-${Date.now()}`}]);
      
      // Show success modal
      setPurchasedReward(reward);
      
      // Save to localStorage for profile page
      const savedRewards = JSON.parse(localStorage.getItem('purchasedRewards') || '[]');
      localStorage.setItem('purchasedRewards', JSON.stringify([
        ...savedRewards,
        {...reward, purchaseDate: new Date().toISOString()}
      ]));
    } else {
      toast.error("Not enough coins to purchase this reward");
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {purchasedReward && (
        <SuccessModal 
          reward={purchasedReward} 
          onClose={() => setPurchasedReward(null)} 
        />
      )}
      
      {/* Animated Lightning Coin Section */}
      <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <LightningCoin />
        <h1 className="text-3xl font-bold mt-4 mb-2">
          You're a top driver!
        </h1>
        <p className="text-muted-foreground mb-4">
          Keep earning more coins with every ride
        </p>
        <div className="inline-flex items-center gap-2 text-4xl font-bold text-primary">
          <Coins className="w-8 h-8" />
          <motion.span 
            className="animate-in slide-in-from-bottom-2 duration-500"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
          >
            {totalCoins.toLocaleString()}
          </motion.span>
        </div>
      </div>

      {/* Available Rewards */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Available Rewards</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onPurchase={handlePurchase}
            />
          ))}
        </div>
      </div>
      
      {/* My Rewards */}
      {myRewards.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-6">My Rewards</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {myRewards.map((reward) => (
              <Card key={reward.id} className="bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <reward.icon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">{reward.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{reward.description}</p>
                  <div className="flex justify-end mt-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">
                      <Check className="w-3 h-3 mr-1" /> Purchased
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* How to Earn More */}
      <Card className="mt-10">
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
