"use client";

import { useState, useRef, useEffect, CSSProperties } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Download, Medal, Newspaper, Share2, Target, Gift, Star } from "lucide-react";
import { useUserStore } from "../store/userStore";
import html2canvas from 'html2canvas';

// Create a simple toast implementation if the component is missing
const useToast = () => {
  return {
    toast: ({ title, description, duration }: { title: string; description: string; duration: number }) => {
      console.log(`Toast: ${title} - ${description}`);
      // Create a simple toast element
      const toastElement = document.createElement('div');
      toastElement.className = 'fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-md shadow-lg z-50';
      toastElement.innerHTML = `
        <h3 class="font-bold text-sm">${title}</h3>
        <p class="text-sm">${description}</p>
      `;
      document.body.appendChild(toastElement);
      
      // Remove toast after duration
      setTimeout(() => {
        document.body.removeChild(toastElement);
      }, duration);
    }
  };
};

// Create a simple HTML to image function if html2canvas is missing
const createImageFromElement = async (element: HTMLElement): Promise<string> => {
  // Return a placeholder if we don't have html2canvas
  console.log('Creating image from element');
  return new Promise((resolve) => {
    try {
      // Try to use the browser's built-in features as a fallback
      const rect = element.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Draw a simple background
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Certificate Generated', canvas.width / 2, canvas.height / 2);
      }
      
      resolve(canvas.toDataURL('image/png'));
    } catch (e) {
      // Fallback to a simple image
      console.error('Error creating image:', e);
      resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI3QrUlMAAAAABJRU5ErkJggg==');
    }
  });
};

// Mock data for leaderboards
const overallLeaderboard = [
  {
    name: "Vaibhav P R",
    image: "https://i.ibb.co/Zzjqq0rk/d.png",
    tier: "Gold",
    level: 47,
    badge: "🏆"
  },
  {
    name: "Rajesh Kumar",
    image: "https://i.pravatar.cc/150?img=1",
    tier: "Gold",
    level: 42,
    badge: "🥈"
  },
  {
    name: "Priya Singh",
    image: "https://i.pravatar.cc/150?img=2",
    tier: "Silver",
    level: 38,
    badge: "🥉"
  }
  // Add more drivers as needed
];

const weeklyLeaderboard = [
  {
    name: "Vaibhav P R",
    image: "https://i.ibb.co/Zzjqq0rk/d.png",
    rides: 85,
    tier: "Gold",
    level: 47
  },
  {
    name: "Suresh Verma",
    image: "https://i.pravatar.cc/150?img=4",
    rides: 72,
    tier: "Gold",
    level: 32
  },
  {
    name: "Meera Reddy",
    image: "https://i.pravatar.cc/150?img=5",
    rides: 65,
    tier: "Silver",
    level: 28
  }
  // Add more drivers as needed
];

const topDriver = {
  name: "Vaibhav P R",
  image: "https://i.ibb.co/Zzjqq0rk/d.png",
  achievement: "Completed 619 rides with perfect 4.8star rating in last Month",
  story: "Started his journey with Namma Yatri 1 years ago. Known for his exceptional service and friendly nature.",
  stats: {
    rides: 547,
    rating: 4.8,
    earnings: "₹32,500"
  }
};

const LeaderboardCard = ({ 
  rank, 
  name, 
  image, 
  tier, 
  level, 
  badge, 
  rides 
}: { 
  rank: number;
  name: string;
  image: string;
  tier: string;
  level: number;
  badge?: string;
  rides?: number;
}) => (
  <div className={`flex items-center gap-4 p-4 rounded-lg ${rank <= 3 ? 'bg-muted/50' : ''} hover:bg-muted/80 transition-colors`}>
    <span className="text-2xl font-bold w-8 text-center">{rank}</span>
    <Avatar className="w-12 h-12">
      <AvatarImage src={image} />
      <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
    </Avatar>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="font-medium">{name}</span>
        {badge && <span className="text-xl">{badge}</span>}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline" className="text-xs">
          {tier}
        </Badge>
        <span>Level {level}</span>
        {rides && <span>• {rides} rides</span>}
      </div>
    </div>
  </div>
);

const MissionCard = ({ mission, status }: { mission: any, status: string }) => (
  <Card className="mb-4 overflow-hidden transition-all duration-200 hover:shadow-md">
    <div className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg mb-1">{mission.title}</h3>
          <p className="text-muted-foreground text-sm mb-2">{mission.description}</p>
          
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="bg-primary/10 text-primary">
              {mission.reward}
            </Badge>
            
            {status === 'active' && (
              <span className="text-xs text-muted-foreground">{mission.deadline}</span>
            )}
            {status === 'completed' && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                Completed {mission.completedDate}
              </Badge>
            )}
            {status === 'upcoming' && (
              <span className="text-xs text-muted-foreground">Starts {mission.startDate}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {status === 'active' && (
            <Button size="sm" variant="outline">
              View Details
            </Button>
          )}
          {status === 'completed' && (
            <Button size="sm" variant="outline">
              <Gift className="w-4 h-4 mr-1" /> Claim
            </Button>
          )}
          {status === 'upcoming' && (
            <Button size="sm" variant="outline">
              <Star className="w-4 h-4 mr-1" /> Remind
            </Button>
          )}
        </div>
      </div>
      
      {status === 'active' && mission.progress && (
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{mission.progress}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${mission.progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  </Card>
);

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("overall");
  const [activeSubTab, setActiveSubTab] = useState("leaderboards");
  const certificateRef = useRef<HTMLDivElement>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const { toast } = useToast();

  // Define sub-tabs for each main tab
  const subTabs = {
    leaderboards: [
      { value: "overall", label: "Overall" },
      { value: "weekly", label: "Weekly" },
      { value: "namma", label: "Namma Driver" }
    ],
    missions: [
      { value: "active", label: "Active Missions" },
      { value: "completed", label: "Completed" },
      { value: "upcoming", label: "Upcoming" }
    ]
  };

  // Sample missions data
  const missions = {
    active: [
      {
        title: "Peak Hour Hero",
        description: "Complete 5 rides between 6-11 AM",
        reward: "500 Coins + 1 Level",
        progress: 60,
        completedRides: 3,
        totalRides: 5,
        deadline: "Today",
        id: "peak-hour-mission"
      },
      {
        title: "Weekend Warrior",
        description: "Complete 20 rides during weekends",
        reward: "500 Coins + 1 Level",
        progress: 90,
        completedRides: 18,
        totalRides: 20,
        deadline: "Today",
        id: "weekend-warrior-mission"
      },
      {
        title: "Quick Start",
        description: "Complete 1 ride",
        reward: "500 Coins + 1 Level",
        progress: 0,
        completedRides: 0,
        totalRides: 1,
        deadline: "Today",
        id: "quick-start-mission"
      }
    ],
    completed: [
      {
        title: "Perfect Rating",
        description: "Maintain a 4.8+ rating for 20 consecutive rides",
        reward: "250 Coins",
        completedDate: "Last week"
      },
      {
        title: "Punctuality Pro",
        description: "Arrive on time for 15 consecutive pickups",
        reward: "200 Coins",
        completedDate: "2 weeks ago"
      }
    ]
  };

  // State for mission completion popup
  const [missionCompletedModal, setMissionCompletedModal] = useState({
    show: false,
    mission: null as any
  });

  // Function to complete a mission
  const completeMission = (mission: any) => {
    if (mission) {
      // Update state to show congratulation modal
      setMissionCompletedModal({
        show: true,
        mission
      });
      
      // Add rewards to global variables
      setTimeout(() => {
        if (mission.reward.includes("Coins")) {
          // Extract coin amount and add to user's coins
          const coinAmount = parseInt(mission.reward.match(/\d+/)[0]);
          // Use the addCoins function from userStore
          const { addCoins } = useUserStore.getState();
          addCoins(coinAmount);
        }
        
        if (mission.reward.includes("Level")) {
          // Add level to user
          const { addLevel } = useUserStore.getState();
          addLevel(1);
        }
      }, 1000);
    }
  };
  
  // Function to close mission completed modal
  const closeMissionCompletedModal = () => {
    setMissionCompletedModal({
      show: false,
      mission: null
    });
  };

  // Function to download certificate
  const downloadCertificate = () => {
    setShowCertificate(true);
    
    // Allow time for the certificate to render
    setTimeout(async () => {
      if (certificateRef.current) {
        try {
          // Use html2canvas to generate image
          const canvas = await html2canvas(certificateRef.current, { scale: 2 });
          const imageUrl = canvas.toDataURL('image/png');
          
          // Create download link
          const link = document.createElement('a');
          link.download = `namma_yatri_certificate_${topDriver.name.replace(/\s+/g, '_')}.png`;
          link.href = imageUrl;
          link.click();
          
          toast({
            title: "Certificate Downloaded",
            description: "Your certificate has been downloaded successfully.",
            duration: 3000,
          });
        } catch (e) {
          console.error("Error downloading certificate:", e);
          toast({
            title: "Download Failed",
            description: "There was an error generating the certificate.",
            duration: 3000,
          });
        } finally {
          setShowCertificate(false);
        }
      }
    }, 500);
  };

  // CSS for confetti animation
  const confettiStyle: {
    container: CSSProperties;
    confetti: CSSProperties;
  } = {
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      pointerEvents: 'none' as const,
    },
    confetti: {
      position: 'absolute' as const,
      width: '10px',
      height: '10px',
      borderRadius: '3px',
      opacity: 0.7,
      animation: 'fall 4s ease-out infinite',
    },
  };

  // CSS keyframes for confetti animation
  useEffect(() => {
    // Add keyframe animation for confetti
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fall {
        0% {
          top: -10%;
          transform: translateX(0) rotate(0deg);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        20% {
          transform: translateX(-20px) rotate(45deg);
        }
        40% {
          transform: translateX(20px) rotate(90deg);
        }
        60% {
          transform: translateX(-20px) rotate(135deg);
        }
        80% {
          transform: translateX(20px) rotate(180deg);
        }
        100% {
          top: 110%;
          transform: translateX(-20px) rotate(225deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl animate-in fade-in duration-500">
      {/* Main navigation */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="w-7 h-7 text-primary" />
          Leaderboard & Missions
        </h1>
      </div>

      {/* Sub Navigation */}
      <div className="border-b mb-8">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveSubTab("leaderboards")}
            className={`pb-2 px-1 font-medium text-lg transition-colors relative ${
              activeSubTab === "leaderboards"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Leaderboards
            {activeSubTab === "leaderboards" && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          
          <button
            onClick={() => setActiveSubTab("missions")}
            className={`pb-2 px-1 font-medium text-lg transition-colors relative ${
              activeSubTab === "missions"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Missions
            {activeSubTab === "missions" && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg max-w-3xl w-full" ref={certificateRef}>
            <div className="border-8 border-double border-primary/20 p-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-primary mb-2">NAMMA YATRI</h2>
                <h3 className="text-xl font-semibold mb-6">Certificate of Excellence</h3>
                
                <div className="my-8">
                  <p className="text-lg mb-2">This certifies that</p>
                  <h2 className="text-3xl font-bold mb-2">{topDriver.name}</h2>
                  <p className="mb-6">has been recognized as</p>
                  <h3 className="text-2xl font-bold text-primary mb-2">NAMMA DRIVER OF THE MONTH</h3>
                  <p className="mb-8">{topDriver.achievement}</p>
                </div>
                
                <div className="flex justify-between items-end mt-12">
                  <div className="text-center">
                    <div className="border-t border-gray-300 pt-2 w-48 mx-auto">
                      <p className="font-semibold">Date</p>
                      <p>{new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <img 
                      src="https://i.ibb.co/hF9Tzgk/signature.png" 
                      alt="CEO Signature" 
                      className="h-16 mx-auto mb-2"
                    />
                    <div className="border-t border-gray-300 pt-2 w-48">
                      <p className="font-semibold">Vimal Kumar</p>
                      <p>CEO, Namma Yatri</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-8 right-8">
                  <Avatar className="w-24 h-24 border-2 border-primary">
                    <AvatarImage src={topDriver.image} />
                    <AvatarFallback>{topDriver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                  <p>Namma Yatri - Empowering Drivers, Connecting Communities</p>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            className="absolute top-4 right-4" 
            variant="outline" 
            onClick={() => setShowCertificate(false)}
          >
            Close
          </Button>
        </div>
      )}
      
      {/* Leaderboards Content */}
      {activeSubTab === "leaderboards" && (
        <Tabs defaultValue="overall" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overall">Overall Leaderboard</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Leaderboard</TabsTrigger>
            <TabsTrigger value="namma">Namma Driver</TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Top Drivers by Level</h2>
            <div className="space-y-4">
              {overallLeaderboard.map((driver, index) => (
                <LeaderboardCard
                  key={index}
                  rank={index + 1}
                  name={driver.name}
                  image={driver.image}
                  tier={driver.tier}
                  level={driver.level}
                  badge={driver.badge}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">This Week's Top Performers</h2>
            <div className="space-y-4">
              {weeklyLeaderboard.map((driver, index) => (
                <LeaderboardCard
                  key={index}
                  rank={index + 1}
                  name={driver.name}
                  image={driver.image}
                  tier={driver.tier}
                  level={driver.level}
                  rides={driver.rides}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="namma">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  Namma Driver of the Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-8">
                  <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-primary/20">
                    <AvatarImage src={topDriver.image} />
                    <AvatarFallback>{topDriver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-2xl font-bold mb-2">{topDriver.name}</h3>
                  <p className="text-muted-foreground">{topDriver.achievement}</p>
                  
                  <div className="grid grid-cols-3 gap-4 my-6">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold">{topDriver.stats.rides}</div>
                      <div className="text-sm text-muted-foreground">Rides</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold">{topDriver.stats.rating}⭐</div>
                      <div className="text-sm text-muted-foreground">Rating</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold">{topDriver.stats.earnings}</div>
                      <div className="text-sm text-muted-foreground">Earned</div>
                    </div>
                  </div>

                  <Button className="mb-8" variant="outline" onClick={downloadCertificate}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Certificate
                  </Button>

                  <div className="grid md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="pt-6">
                        <Medal className="w-8 h-8 text-primary mx-auto mb-4" />
                        <h4 className="font-semibold mb-2">Recognition</h4>
                        <p className="text-sm text-muted-foreground">
                          Special medal from Namma Yatri's Founder
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <Newspaper className="w-8 h-8 text-primary mx-auto mb-4" />
                        <h4 className="font-semibold mb-2">Featured Story</h4>
                        <p className="text-sm text-muted-foreground">
                          Featured in local newspapers
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <Share2 className="w-8 h-8 text-primary mx-auto mb-4" />
                        <h4 className="font-semibold mb-2">Social Media</h4>
                        <p className="text-sm text-muted-foreground">
                          Story shared on official channels
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Missions Content */}
      {activeSubTab === "missions" && (
        <Tabs defaultValue="active" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active Missions</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Active Missions</h2>
              <Badge className="bg-primary text-white">{missions.active.length} Active</Badge>
            </div>
            <div className="space-y-3">
              {missions.active.map((mission, index) => (
                <Card key={index} className="mb-4 overflow-hidden transition-all duration-200 hover:shadow-md">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{mission.title}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{mission.description}</p>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="bg-primary/10 text-primary">
                            {mission.reward}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{mission.deadline}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => completeMission(mission)}
                        >
                          {mission.progress === 100 ? "Claim Reward" : "View Details"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress: {mission.completedRides}/{mission.totalRides} rides</span>
                        <span>{mission.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${mission.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Completed Missions</h2>
              <Badge className="bg-green-500 text-white">{missions.completed.length} Completed</Badge>
            </div>
            <div className="space-y-3">
              {missions.completed.map((mission, index) => (
                <MissionCard key={index} mission={mission} status="completed" />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Mission Completed Modal */}
      {missionCompletedModal.show && missionCompletedModal.mission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white to-primary/5 p-8 rounded-lg max-w-md w-full text-center relative overflow-hidden">
            {/* Confetti animation using pseudo-elements and animations */}
            <div style={confettiStyle.container}>
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  style={{
                    ...confettiStyle.confetti,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    backgroundColor: ['#FFC700', '#FF3E00', '#00A3FF', '#7700FF', '#00C647'][Math.floor(Math.random() * 5)]
                  }}
                />
              ))}
            </div>
            
            <h2 className="text-3xl font-bold mb-4 text-primary">Mission Complete!</h2>
            <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Trophy className="w-12 h-12 text-primary" />
            </div>
            
            <h3 className="text-xl font-bold mb-2">{missionCompletedModal.mission.title}</h3>
            <p className="text-muted-foreground mb-6">{missionCompletedModal.mission.description}</p>
            
            <div className="bg-primary/10 p-4 rounded-lg mb-6">
              <h4 className="font-semibold mb-2">Rewards Earned:</h4>
              <p className="text-primary font-bold text-xl">{missionCompletedModal.mission.reward}</p>
            </div>
            
            <Button onClick={closeMissionCompletedModal}>
              Awesome!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
