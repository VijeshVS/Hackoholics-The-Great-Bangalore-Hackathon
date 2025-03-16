"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Crown, Trophy } from "lucide-react";
import { useUserStore, tierLevels } from "@/app/store/userStore";
import { cn } from "@/lib/utils";

export function TierProgress() {
  // Get user data from store
  const { currentLevel, currentTier, getCurrentTierProgress, getLevelsToNextTier } = useUserStore();
  
  // Find current tier index and next tier
  const currentTierIndex = tierLevels.findIndex(tier => tier.name === currentTier.name);

  return (
    <Card className="p-4 glass-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <h3 className="text-base font-semibold">Driver Tier</h3>
        </div>
      </div>

      <div className="flex gap-1 mb-2 h-20">
        {tierLevels.map((tier, index) => {
          // Calculate the flex grow value based on tier - higher tiers get larger bars
          const flexGrow = index + 1;
          const isCurrentTier = tier.name === currentTier.name;
          const isPastTier = index < currentTierIndex;
          const isFutureTier = index > currentTierIndex;
          
          return (
            <motion.div
              key={tier.name}
              className={cn(
                "relative flex flex-col items-center justify-end rounded-t-md",
                isPastTier ? "bg-primary/80" : 
                isCurrentTier ? "bg-primary" : 
                "bg-muted/40"
              )}
              style={{ 
                flexGrow,
                transition: "all 0.3s ease" 
              }}
              initial={{ height: "40%" }}
              animate={{ 
                height: isPastTier ? "80%" : 
                        isCurrentTier ? "65%" : 
                        isFutureTier ? `${40 + (index - currentTierIndex) * 10}%` : "40%" 
              }}
            >
              {/* Badge on top of bar */}
              <div className={cn(
                "absolute -top-6 flex items-center justify-center w-8 h-8 rounded-full", 
                isPastTier || isCurrentTier ? "bg-primary/10" : "bg-muted/30",
                isPastTier ? "text-primary" : isCurrentTier ? "text-primary font-bold" : "text-muted-foreground"
              )}>
                <span className="text-lg">{tier.icon}</span>
              </div>
              
              {/* Tier name */}
              <span className={cn(
                "absolute -bottom-5 text-xs whitespace-nowrap",
                isPastTier || isCurrentTier ? "font-medium" : "text-muted-foreground"
              )}>
                {tier.name}
              </span>
              
              {/* Level range */}
              <div className="absolute -bottom-10 text-[10px] text-muted-foreground whitespace-nowrap">
                {tier.requiredLevel} - {index < tierLevels.length - 1 ? tierLevels[index + 1].requiredLevel - 1 : "∞"}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="pt-10 text-center">
        <span className="text-xs px-2 py-1 bg-primary/10 rounded-full text-primary font-medium">
          Current Level: {currentLevel}
        </span>
      </div>
    </Card>
  );
}