"use client";

import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TierBadgeProps {
  tier: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
}

const tierColors = {
  Bronze: "bg-amber-900",
  Silver: "bg-gray-400",
  Gold: "bg-yellow-500",
  Platinum: "bg-blue-500",
  Diamond: "bg-purple-500"
};

export function TierBadge({ tier }: TierBadgeProps) {
  return (
    <Badge variant="outline" className="tier-badge">
      <Crown className={`w-4 h-4 mr-1 ${tierColors[tier]}`} />
      {tier} Driver
    </Badge>
  );
} 