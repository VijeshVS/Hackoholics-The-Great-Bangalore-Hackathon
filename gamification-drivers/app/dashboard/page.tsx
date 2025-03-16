"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Trophy,
  Flame,
  Target,
  Gift,
  MapPin,
  Crown,
  Star,
  Coins,
  ChevronUp,
  Clock,
  Car,
  Medal,
  Users,
  User,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TierProgress } from "../components/tier-progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearchParams } from "next/navigation";
import { useRideStore } from "../store/rideStore";
import { useUserStore, tierLevels } from "../store/userStore";

// Generate random drivers for leaderboard
const generateDrivers = (count: number) => {
  const names = [
    "Rahul Singh", "Priya Patel", "Amit Kumar", "Deepa Sharma", 
    "Vikram Reddy", "Ananya Desai", "Rajesh Gupta", "Meera Iyer", 
    "Sanjay Joshi", "Kavita Nair", "Arjun Malhotra", "Neha Verma",
    "Suresh Menon", "Divya Rao", "Kiran Patel", "Pooja Sharma"
  ];
  
  const tiers = [
    { name: "Bronze", icon: "🥉" },
    { name: "Silver", icon: "🥈" },
    { name: "Gold", icon: "🥇" },
    { name: "Platinum", icon: "💎" },
    { name: "Diamond", icon: "💠" },
    { name: "Crown", icon: "👑" }
  ];
  
  return Array(count).fill(null).map((_, i) => {
    const tierIndex = Math.floor(Math.random() * tiers.length);
    return {
      id: i + 1,
      name: names[Math.floor(Math.random() * names.length)],
      xp: Math.floor(Math.random() * 5000),
      rides: Math.floor(Math.random() * 2000),
      tier: tiers[tierIndex],
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
    };
  }).sort((a, b) => b.xp - a.xp);
};

const generateHeatMapData = () => {
  const months = Array(12).fill(null).map(() => 
    Array(31).fill(null).map(() => Math.floor(Math.random() * 12))
  );
  return months;
};

const HeatMap = ({ data, month }: { data: number[][], month: number }) => {
  const getColorClass = (rides: number) => {
    if (rides === 0) return "bg-[#EBEDF0] dark:bg-[#161B22]";
    if (rides <= 3) return "bg-[#9BE9A8] dark:bg-[#39D353]";
    if (rides <= 6) return "bg-[#40C463] dark:bg-[#26A641]";
    if (rides <= 9) return "bg-[#30A14E] dark:bg-[#006D32]";
    return "bg-[#216E39] dark:bg-[#0E4429]";
  };

  const getLegendLabel = (rides: number) => {
    if (rides === 0) return "No rides";
    if (rides <= 3) return "1-3 rides";
    if (rides <= 6) return "4-6 rides";
    if (rides <= 9) return "7-9 rides";
    return "10+ rides";
  };

  // Group the data into weeks (rows of 7 days)
  const weeks = [];
  for (let i = 0; i < data[month].length; i += 7) {
    weeks.push(data[month].slice(i, i + 7));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-[1px]">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex gap-[1px]">
            {week.map((rides, dayIndex) => (
              <div
                key={dayIndex}
                className={cn(
                  "h-[7px] w-[7px] min-w-[7px] min-h-[7px] rounded-[1px] transition-colors",
                  getColorClass(rides)
                )}
                title={`${rides} rides on day ${weekIndex * 7 + dayIndex + 1}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {[0, 2, 5, 8, 11].map((rides) => (
            <div key={rides} className="flex items-center gap-1">
              <div 
                className={cn(
                  "w-2 h-2 rounded-[1px]",
                  getColorClass(rides)
                )}
              />
              <span className="text-[9px]">{getLegendLabel(rides)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, change, icon: Icon, progress }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="stats-card"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {change && (
        <Badge variant="outline" className="bg-green-500/10 text-green-500">
          <ChevronUp className="w-3 h-3 mr-1" />
          {change}
        </Badge>
      )}
    </div>
    <p className="text-3xl font-bold">{value}</p>
    {progress && (
      <>
        <Progress value={progress} className="mt-4" />
        <p className="text-sm text-muted-foreground mt-2">
          Progress: {progress}%
        </p>
      </>
    )}
  </motion.div>
);

// Leaderboard component
const Leaderboard = ({ title, drivers, icon: Icon }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="leaderboard-3d bg-card/50 p-4 rounded-xl"
  >
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-primary" />
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <div className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground mb-2 px-2">
        <div>Rank</div>
        <div>Driver</div>
        <div>XP</div>
      </div>
      <ScrollArea className="h-[300px] pr-4">
        {drivers.map((driver: any, index: number) => (
          <motion.div 
            key={driver.id}
            className="leaderboard-row grid grid-cols-1 md:grid-cols-3 items-center gap-2 p-2 rounded-lg mb-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
              {index + 1}
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={driver.avatar} />
                <AvatarFallback>{driver.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{driver.name}</p>
                <p className="text-xs text-muted-foreground">{driver.rides} rides</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">{driver.xp}</span>
              <span className="text-xs">{driver.tier.icon}</span>
            </div>
          </motion.div>
        ))}
      </ScrollArea>
    </div>
  </motion.div>
);

// Components for profile menu options
const XPContent = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Peak Hour Champion</h3>
        <Badge variant="secondary">Active</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Complete 10 rides during peak hours (6-9 AM) to earn bonus XP
      </p>
      <Progress value={60} className="mb-2" />
      <p className="text-sm text-muted-foreground">6/10 rides completed</p>
      <div className="mt-4 flex items-center gap-2">
        <Badge variant="outline" className="bg-primary/10">
          +₹500 Bonus
        </Badge>
        <Badge variant="outline" className="bg-primary/10">
          +1000 XP
        </Badge>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Weekend Warrior</h3>
        <Badge variant="outline">Available</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Complete 20 rides this weekend to unlock special XP bonuses
      </p>
      <Progress value={0} className="mb-2" />
      <p className="text-sm text-muted-foreground">0/20 rides completed</p>
      <div className="mt-4 flex items-center gap-2">
        <Badge variant="outline" className="bg-primary/10">
          +₹1000 Bonus
        </Badge>
        <Badge variant="outline" className="bg-primary/10">
          +2000 XP
        </Badge>
      </div>
    </motion.div>
  </div>
);

const CoinsContent = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Fuel Discount</h3>
        <Badge variant="secondary">Claimable</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Get ₹100 off on your next fuel refill at any IOCL pump
      </p>
      <div className="mt-4 flex items-center gap-2">
        <Badge variant="outline" className="bg-accent/20">
          500 Coins
        </Badge>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Vehicle Service</h3>
        <Badge variant="outline">Premium</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Free basic service at authorized service centers
      </p>
      <div className="mt-4 flex items-center gap-2">
        <Badge variant="outline" className="bg-accent/20">
          1500 Coins
        </Badge>
      </div>
    </motion.div>
  </div>
);

const HotspotsContent = () => (
  <div className="glass-card p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">Active Hotspots</h3>
      <Badge variant="outline">Live</Badge>
    </div>
    <p className="text-sm text-muted-foreground mb-4">
      High demand areas with surge pricing
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
        <MapPin className="w-5 h-5 text-primary" />
        <div>
          <p className="text-sm font-medium">MG Road</p>
          <p className="text-xs text-muted-foreground">1.5x surge • 3.2 km away</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
        <MapPin className="w-5 h-5 text-primary" />
        <div>
          <p className="text-sm font-medium">Indiranagar</p>
          <p className="text-xs text-muted-foreground">2.0x surge • 5.7 km away</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
        <MapPin className="w-5 h-5 text-primary" />
        <div>
          <p className="text-sm font-medium">Whitefield</p>
          <p className="text-xs text-muted-foreground">1.8x surge • 12.3 km away</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
        <MapPin className="w-5 h-5 text-primary" />
        <div>
          <p className="text-sm font-medium">Electronic City</p>
          <p className="text-xs text-muted-foreground">1.3x surge • 15.1 km away</p>
        </div>
      </div>
    </div>
  </div>
);

// Profile content component
const ProfileContent = () => (
  <div className="space-y-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-start gap-6">
        <Avatar className="w-24 h-24">
          <AvatarImage src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=120&h=120&fit=crop" />
          <AvatarFallback>NY</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Rahul Singh</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              <Star className="w-4 h-4 mr-1 text-primary" />
              4.2★ Rating
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Flame className="w-4 h-4 mr-1 text-red-500" />
              28 Day Streak
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Driver since January 2022</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="flex flex-col items-center p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Earnings</p>
          <p className="text-2xl font-bold">₹245,780</p>
        </div>
        <div className="flex flex-col items-center p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Rides</p>
          <p className="text-2xl font-bold">1,286</p>
        </div>
        <div className="flex flex-col items-center p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Distance</p>
          <p className="text-2xl font-bold">12,458 km</p>
        </div>
      </div>
    </motion.div>
    
    {/* Driver Performance */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <h3 className="text-xl font-bold mb-4">Performance Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <p className="text-sm font-medium">Acceptance Rate</p>
              <p className="text-sm font-medium">92%</p>
            </div>
            <Progress value={92} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <p className="text-sm font-medium">Completion Rate</p>
              <p className="text-sm font-medium">98%</p>
            </div>
            <Progress value={98} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <p className="text-sm font-medium">On-time Arrival</p>
              <p className="text-sm font-medium">89%</p>
            </div>
            <Progress value={89} className="h-2" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium">Average Rating</p>
            </div>
            <p className="text-sm font-bold">4.2★</p>
          </div>
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium">Avg. Response Time</p>
            </div>
            <p className="text-sm font-bold">2.3 mins</p>
          </div>
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium">Completed Missions</p>
            </div>
            <p className="text-sm font-bold">42</p>
          </div>
        </div>
      </div>
    </motion.div>
    
    {/* Activity Streak */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {[
          { date: "Today", activity: "Completed 8 rides", amount: "+₹1,240" },
          { date: "Yesterday", activity: "Completed 12 rides", amount: "+₹1,850" },
          { date: "Jul 12, 2023", activity: "Earned Peak Hour Bonus", amount: "+₹500" },
          { date: "Jul 11, 2023", activity: "Completed 10 rides", amount: "+₹1,560" },
          { date: "Jul 10, 2023", activity: "Earned Weekend Warrior Badge", amount: "+1000 XP" }
        ].map((item, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-3 border-b border-border last:border-0"
          >
            <div>
              <p className="text-sm font-medium">{item.activity}</p>
              <p className="text-xs text-muted-foreground">{item.date}</p>
            </div>
            <p className={cn(
              "text-sm font-medium",
              item.amount.includes("XP") ? "text-primary" : "text-green-500"
            )}>
              {item.amount}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

// Leaderboard content component
const LeaderboardContent = ({ weeklyDrivers, overallDrivers }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Leaderboard 
      title="Weekly Leaderboard" 
      drivers={weeklyDrivers} 
      icon={Trophy} 
    />
    <Leaderboard 
      title="Overall Leaderboard" 
      drivers={overallDrivers} 
      icon={Medal} 
    />
  </div>
);

// Activity Streak Component
const ActivityStreak = () => {
  // Days of week
  const daysOfWeek = [ 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  
  // Get current day of week (0-6, where 0 is Sunday)
  const currentDayIndex = new Date().getDay();
  
  // Mock data - which days have been completed
  const completedDays = [5, 6]; // Sunday through Wednesday completed
  const goalDay = 6; // Saturday is goal day
  
  // Streak count
  const streakCount = 2; // From the image
  
  // Calculate progress percentage (completed days / 7 days in a week)
  const progressPercentage = (completedDays.length / 7) * 100;
  
  return (
    <Card className="p-5 glass-card overflow-hidden">
      <div className="relative">
        {/* Flame icon and streak count */}
        <motion.div 
          className="flex flex-col items-center mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-20 h-20 flex items-center justify-center mb-1"
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 1.5 
            }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 rounded-full blur-lg opacity-20"></div>
              <div className="relative z-10">
                <svg width="60" height="70" viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M30 0C30 0 45 25 45 40C45 55 30 65 15 55C0 45 15 30 15 30C15 30 10 55 30 65C50 75 60 50 45 30C30 10 30 0 30 0Z" fill="url(#paint0_linear)" />
                  <defs>
                    <linearGradient id="paint0_linear" x1="30" y1="0" x2="30" y2="70" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FF9500" />
                      <stop offset="1" stopColor="#FFCC00" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="font-bold text-4xl">{streakCount}</div>
            <div className="text-orange-500 font-semibold">day streak!</div>
          </motion.div>
        </motion.div>
        
        {/* Days of week */}
        <motion.div 
          className="grid grid-cols-7 gap-1 my-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {daysOfWeek.map((day, index) => (
            <motion.div 
              key={day} 
              className="flex flex-col items-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * index + 0.4 }}
            >
              <div className="text-xs font-medium text-muted-foreground mb-1">{day}</div>
              <motion.div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  completedDays.includes(index) ? "bg-orange-500 text-white" : 
                  index === goalDay ? "border-2 border-yellow-500" : 
                  index <= currentDayIndex ? "bg-gray-600" : "bg-gray-700"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {completedDays.includes(index) ? (
                  <Check className="h-4 w-4" />
                ) : index === goalDay ? (
                  <span className="text-lg">⭐</span>
                ) : null}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Progress indicator */}
        <motion.div 
          className="text-center mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-sm text-muted-foreground">
            You're halfway to your <span className="text-orange-500 font-medium">perfect week!</span>
          </div>
        </motion.div>
      </div>
    </Card>
  );
};

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [heatMapData] = useState(generateHeatMapData());
  const [weeklyDrivers] = useState(generateDrivers(10));
  const [overallDrivers] = useState(generateDrivers(10));
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showMainContent, setShowMainContent] = useState(true);
  
  // Get global variables from stores
  const { totalRides, totalEarnings } = useRideStore();
  const { driverScore, totalCoins, currentLevel } = useUserStore();
  
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    
    // Check for section parameter in URL
    const section = searchParams.get('section');
    const timestamp = searchParams.get('t'); // Handle timestamp parameter
    
    if (section) {
      setSelectedSection(section);
      setShowMainContent(false);
    } else {
      // Reset to main content if no section is specified
      setSelectedSection(null);
      setShowMainContent(true);
    }
  }, [searchParams]);

  if (!mounted) return null;

  // Render content based on selected profile option
  const renderSelectedContent = () => {
    switch (selectedSection) {
      case 'profile':
        return <ProfileContent />;
      case 'xp':
        return <XPContent />;
      case 'coins':
        return <CoinsContent />;
      case 'hotspots':
        return <HotspotsContent />;
      case 'leaderboard':
        return <LeaderboardContent weeklyDrivers={weeklyDrivers} overallDrivers={overallDrivers} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container py-6">
        {selectedSection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 mb-6"
          >
            <div className="flex items-center gap-2">
              {selectedSection === 'profile' && <User className="w-5 h-5 text-primary" />}
              {selectedSection === 'xp' && <Target className="w-5 h-5 text-primary" />}
              {selectedSection === 'coins' && <Gift className="w-5 h-5 text-primary" />}
              {selectedSection === 'hotspots' && <MapPin className="w-5 h-5 text-primary" />}
              {selectedSection === 'leaderboard' && <Trophy className="w-5 h-5 text-primary" />}
              <h2 className="text-2xl font-bold capitalize">{selectedSection}</h2>
            </div>
            {renderSelectedContent()}
          </motion.div>
        )}

        {(!selectedSection || showMainContent) && (
          <div className="space-y-6">
            {/* 1st Row: Total Earnings, Total Rides, Driver Score, Activity Streak */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Total Earnings */}
              <StatsCard
                title="Total Earnings"
                value={`₹${totalEarnings}`}
                change="+15.5%"
                icon={Coins}
                progress={82}
              />
              
              {/* Total Rides */}
              <StatsCard
                title="Total Rides"
                value={totalRides}
                icon={Car}
                progress={75}
              />
              
              {/* Driver Score */}
              <StatsCard
                title="Driver Score"
                value={`${driverScore}★`}
                icon={Star}
                progress={98}
              />
              
              {/* Activity Streak */}
              <ActivityStreak />
            </div>

            {/* 2nd Row: Total Coins, Current Level, Streak Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Driver Tier */}
              <StatsCard
                title="Total Coins"
                value={totalCoins}
                icon={Coins}
                progress={82}
              />
              
              {/* Current Level */}
              <StatsCard
                title="Current Level"
                value={currentLevel}
                icon={Crown}
                progress={75}
              />
              
              {/* Another Activity Stats Card */}
              <div className="stats-card glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Streak Info</h3>
                  </div>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-500">
                    <ChevronUp className="w-3 h-3 mr-1" />
                    +2 days
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-orange-500">2</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Current Streak</p>
                    <Progress value={28.5} className="mt-2 h-2" />
                    <p className="text-xs text-muted-foreground mt-1">2 of 7 days complete</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3rd Row: Driver Tier (Full Row) with enhanced styling */}
            <div className="driver-tier-full">
              <Card className="p-6 glass-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Driver Tier</h3>
                  </div>
                </div>

                {/* Enhanced Tier Visualization */}
                <div className="w-full relative py-10">
                  {/* Step-like Background */}
                  <div className="absolute left-0 right-0 h-1 bg-gray-200 top-1/2 transform -translate-y-1/2"></div>
                  
                  {/* Tiers displayed in a progressive order */}
                  <div className="flex justify-between relative">
                    {tierLevels.map((tier, index) => {
                      // Calculate dynamic values for step-like appearance
                      const heightMultiplier = 0.5 + (index * 0.1);
                      const isCurrentTier = tier.name === useUserStore.getState().currentTier.name;
                      
                      return (
                        <motion.div
                          key={tier.name}
                          className={`flex flex-col items-center relative ${isCurrentTier ? 'z-10' : ''}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          style={{ 
                            marginTop: `${index * 20}px` // Creating step-like effect
                          }}
                        >
                          {/* Connector to previous tier */}
                          {index > 0 && (
                            <div 
                              className="absolute h-1 bg-gradient-to-r from-gray-400 to-gray-200" 
                              style={{ 
                                width: `100%`, 
                                left: '-50%', 
                                top: '30px',
                                zIndex: 0
                              }}
                            ></div>
                          )}
                          
                          {/* Tier Icon with Badge */}
                          <div 
                            className={`relative w-16 h-16 flex items-center justify-center rounded-full 
                              ${isCurrentTier 
                                ? 'bg-primary text-white ring-4 ring-primary/20' 
                                : index < tierLevels.findIndex(t => t.name === useUserStore.getState().currentTier.name)
                                  ? 'bg-gray-100 text-gray-600' 
                                  : 'bg-gray-100 text-gray-400'
                              }
                              transition-all duration-300 ease-in-out
                            `}
                          >
                            <span className="text-2xl">{tier.icon}</span>
                            {isCurrentTier && (
                              <motion.div 
                                className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
                              >
                                <Check className="w-3 h-3" />
                              </motion.div>
                            )}
                          </div>
                          
                          {/* Tier Name */}
                          <p 
                            className={`mt-3 font-medium text-sm
                              ${isCurrentTier 
                                ? 'text-primary' 
                                : index < tierLevels.findIndex(t => t.name === useUserStore.getState().currentTier.name)
                                  ? 'text-gray-600' 
                                  : 'text-gray-400'
                              }
                            `}
                          >
                            {tier.name}
                          </p>
                          
                          {/* Level Requirement */}
                          <p className="text-xs text-muted-foreground">
                            Level {tier.requiredLevel}+
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Progress towards next tier */}
                <div className="mt-10 bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Current Progress</span>
                    <span className="text-sm font-medium">
                      {useUserStore.getState().getCurrentTierProgress()}%
                    </span>
                  </div>
                  <Progress value={useUserStore.getState().getCurrentTierProgress()} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {useUserStore.getState().getLevelsToNextTier()} more levels until next tier
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}