"use client";

import { Car, Coins, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatsCardProps {
  title: string;
  value: string;
  icon: any;
  progress: number;
  change?: string;
}

function StatsCard({ title, value, icon: Icon, progress, change }: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          <h3 className="font-medium">{title}</h3>
        </div>
        {change && (
          <span className={`text-xs font-medium ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mb-2">{value}</p>
      <Progress value={progress} className="h-1" />
    </Card>
  );
}

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard
        title="Today's Earnings"
        value="₹2,450"
        change="+15.5%"
        icon={Coins}
        progress={82}
      />
      <StatsCard
        title="Total Rides"
        value="1,286"
        icon={Car}
        progress={75}
      />
      <StatsCard
        title="Driver Score"
        value="4.92★"
        icon={Star}
        progress={98}
      />
    </div>
  );
} 