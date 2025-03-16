"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Crown } from "lucide-react";
import { useUserStore, tierLevels } from "@/app/store/userStore";

export function TierProgress() {
  // Get user data from store
  const { currentLevel, currentTier, getCurrentTierProgress, getLevelsToNextTier } = useUserStore();
  
  // Find current tier index and next tier
  const currentTierIndex = tierLevels.findIndex(tier => tier.name === currentTier.name);
  const nextTier = currentTierIndex < tierLevels.length - 1 ? tierLevels[currentTierIndex + 1] : null;
  
  // Calculate progress percentage
  const progressPercentage = getCurrentTierProgress();
  const levelsToNextTier = getLevelsToNextTier();

  return (
    <Card className="p-6 glass-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Driver Tier</h3>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 mb-6">
        {tierLevels.map((tier, index) => (
          <motion.div
            key={tier.name}
            className={`flex flex-col items-center ${
              tier.name === currentTier.name
                ? "tier-glow p-2 rounded-lg"
                : "p-2 rounded-lg"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div
              className={`text-2xl ${
                index <= currentTierIndex ? "" : "opacity-40"
              }`}
            >
              {tier.icon}
            </div>
            <p
              className={`text-xs mt-1 ${
                index <= currentTierIndex
                  ? "font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {tier.name}
            </p>
          </motion.div>
        ))}
      </div>

      {nextTier && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{currentTier.name}</span>
            <span>{nextTier.name}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Level {currentLevel}</span>
            <span>Level {nextTier.requiredLevel}</span>
          </div>
        </div>
      )}
    </Card>
  );
}