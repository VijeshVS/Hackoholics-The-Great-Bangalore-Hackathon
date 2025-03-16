"use client";

import { Trophy, Medal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Driver {
  id: number;
  name: string;
  avatar: string;
  score: number;
  rank: number;
}

// Generate random drivers for leaderboard
const generateDrivers = (count: number): Driver[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Driver ${i + 1}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
    score: Math.floor(Math.random() * 1000) + 5000,
    rank: i + 1
  })).sort((a, b) => b.score - a.score);
};

export function Leaderboard() {
  const drivers = generateDrivers(5);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Top Drivers</h2>
      </div>
      <div className="space-y-4">
        {drivers.map((driver) => (
          <div key={driver.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-6">{driver.rank}</span>
              <Avatar className="w-8 h-8">
                <AvatarImage src={driver.avatar} alt={driver.name} />
                <AvatarFallback>{driver.name[0]}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{driver.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {driver.rank === 1 && <Medal className="w-4 h-4 text-yellow-500" />}
              <span className="font-bold">{driver.score.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 