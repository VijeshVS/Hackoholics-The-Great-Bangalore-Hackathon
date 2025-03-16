"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Download, Medal, Newspaper, Share2, Target, Gift, Star } from "lucide-react";
import { motion } from "framer-motion";

// Mock data for leaderboards
const overallLeaderboard = [
  {
    name: "Rajesh Kumar",
    image: "https://i.pravatar.cc/150?img=1",
    tier: "Gold",
    level: 45,
    badge: "🏆"
  },
  {
    name: "Priya Singh",
    image: "https://i.pravatar.cc/150?img=2",
    tier: "Gold",
    level: 42,
    badge: "🥈"
  },
  {
    name: "Amit Patel",
    image: "https://i.pravatar.cc/150?img=3",
    tier: "Silver",
    level: 38,
    badge: "🥉"
  }
  // Add more drivers as needed
];

const weeklyLeaderboard = [
  {
    name: "Suresh Verma",
    image: "https://i.pravatar.cc/150?img=4",
    rides: 85,
    tier: "Gold",
    level: 32
  },
  {
    name: "Meera Reddy",
    image: "https://i.pravatar.cc/150?img=5",
    rides: 78,
    tier: "Silver",
    level: 28
  },
  {
    name: "Karthik R",
    image: "https://i.pravatar.cc/150?img=6",
    rides: 72,
    tier: "Bronze",
    level: 25
  }
  // Add more drivers as needed
];

const topDriver = {
  name: "Rahul Kumar",
  image: "https://i.ibb.co/XZwkbmJS/auto.png",
  achievement: "Completed 619 rides with perfect 4.8star rating in last Month",
  story: "Started his journey with Namma Yatri 1 years ago. Known for his exceptional service and friendly nature.",
  stats: {
    rides: 547,
    rating: 4.8,
    earnings: "₹32,"
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

// Certificate Generation Function
const generateCertificate = (driverName: string, driverImage: string) => {
  // Create a new window
  const certificateWindow = window.open('', '_blank');
  
  if (!certificateWindow) {
    alert('Please allow popups to view the certificate');
    return;
  }
  
  // Current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // CEO signature - Base64 encoded placeholder signature
  const ceoSignature = "https://i.ibb.co/XZwkbmJS/signature.png"; // Replace with actual signature
  
  // Certificate HTML
  certificateWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Namma Yatri - Certificate of Excellence</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8f9fa;
          color: #1a1a1a;
        }
        .certificate-container {
          width: 800px;
          height: 600px;
          margin: 20px auto;
          background-color: white;
          border: 15px solid #7c3aed;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }
        .certificate-header {
          text-align: center;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .certificate-title {
          font-size: 36px;
          font-weight: bold;
          color: #7c3aed;
          margin: 10px 0;
        }
        .certificate-subtitle {
          font-size: 18px;
          color: #666;
          margin-bottom: 10px;
        }
        .certificate-body {
          text-align: center;
          margin: 40px 0;
        }
        .recipient-name {
          font-size: 30px;
          font-weight: bold;
          margin: 20px 0;
        }
        .certificate-text {
          font-size: 18px;
          line-height: 1.6;
          margin: 20px 60px;
          text-align: center;
        }
        .certificate-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          padding: 0 40px;
        }
        .signature {
          text-align: center;
        }
        .signature img {
          max-height: 60px;
          margin-bottom: 10px;
        }
        .signature-name {
          font-weight: bold;
        }
        .signature-title {
          font-size: 14px;
          color: #666;
        }
        .certificate-date {
          text-align: center;
          margin-top: 20px;
        }
        .profile-image {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          margin: 0 auto 20px;
          display: block;
          border: 3px solid #7c3aed;
        }
        .certificate-seal {
          position: absolute;
          bottom: 30px;
          right: 40px;
          opacity: 0.2;
          width: 120px;
          height: 120px;
        }
        .certificate-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.03;
          z-index: -1;
        }
        .print-button {
          display: block;
          margin: 20px auto;
          padding: 10px 20px;
          background-color: #7c3aed;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
        }
        @media print {
          .print-button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <button class="print-button" onclick="window.print();">Print Certificate</button>
      <div class="certificate-container">
        <img class="certificate-background" src="https://i.ibb.co/4ZQg7BN/auto.png" alt="Background" />
        <div class="certificate-header">
          <div class="certificate-title">Certificate of Excellence</div>
          <div class="certificate-subtitle">Namma Yatri Driver of the Month</div>
        </div>
        <div class="certificate-body">
          <img class="profile-image" src="${driverImage}" alt="${driverName}" />
          <div class="recipient-name">${driverName}</div>
          <div class="certificate-text">
            This certificate is presented in recognition of outstanding service, commitment to excellence,
            and exceptional performance as a Namma Yatri driver.
            <br/><br/>
            Your dedication to providing quality service has set a high standard for all.
          </div>
        </div>
        <div class="certificate-footer">
          <div class="signature">
            <img src="${ceoSignature}" alt="CEO Signature" />
            <div class="signature-name">Vimal Kumar</div>
            <div class="signature-title">CEO, Namma Yatri</div>
          </div>
          <div class="certificate-date">
            Issued on: ${currentDate}
          </div>
        </div>
        <img class="certificate-seal" src="https://i.ibb.co/4ZQg7BN/auto.png" alt="Seal" />
      </div>
    </body>
    </html>
  `);
  
  certificateWindow.document.close();
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("overall");
  const [activeSubTab, setActiveSubTab] = useState("leaderboards");

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
        title: "Ride Master",
        description: "Complete 50 rides in a week",
        reward: "500 Coins",
        progress: 65,
        deadline: "3 days left"
      },
      {
        title: "Perfect Rating",
        description: "Maintain a 4.8+ rating for 20 consecutive rides",
        reward: "300 Coins",
        progress: 80,
        deadline: "2 days left"
      },
      {
        title: "Early Bird",
        description: "Complete 10 rides before 9 AM",
        reward: "200 Coins",
        progress: 40,
        deadline: "5 days left"
      }
    ],
    completed: [
      {
        title: "Weekend Warrior",
        description: "Complete 20 rides during weekends",
        reward: "250 Coins",
        completedDate: "Last week"
      },
      {
        title: "Punctuality Pro",
        description: "Arrive on time for 15 consecutive pickups",
        reward: "200 Coins",
        completedDate: "2 weeks ago"
      }
    ],
    upcoming: [
      {
        title: "City Explorer",
        description: "Complete rides in 5 different areas of the city",
        reward: "350 Coins + Badge",
        startDate: "Next week"
      },
      {
        title: "Ride Marathon",
        description: "Complete 100 rides in a month",
        reward: "1000 Coins + Tier Boost",
        startDate: "Next month"
      }
    ]
  };

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

                  <Button 
                    className="mb-8" 
                    variant="default"
                    onClick={() => generateCertificate(topDriver.name, topDriver.image)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Certificate
                  </Button>

                  <div className="grid md:grid-cols-3 gap-6">
                    <motion.div 
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Card className="border-purple-500 border-2 overflow-hidden">
                        <div className="h-40 overflow-hidden">
                          <img 
                            src="https://i.ibb.co/4ZQg7BN/auto.png" 
                            alt="Recognition" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="pt-6">
                          <Medal className="w-8 h-8 text-primary mx-auto mb-4" />
                          <h4 className="font-semibold mb-2">Recognition</h4>
                          <p className="text-sm text-muted-foreground">
                            Special medal from Namma Yatri's Founder
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Card className="border-purple-500 border-2 overflow-hidden">
                        <div className="h-40 overflow-hidden">
                          <img 
                            src="https://i.ibb.co/v6sNS6j/images.jpg" 
                            alt="Featured Story" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="pt-6">
                          <Newspaper className="w-8 h-8 text-primary mx-auto mb-4" />
                          <h4 className="font-semibold mb-2">Featured Story</h4>
                          <p className="text-sm text-muted-foreground">
                            Featured in local newspapers
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Card className="border-purple-500 border-2 overflow-hidden">
                        <div className="h-40 overflow-hidden">
                          <img 
                            src="https://i.ibb.co/jkC61yg/instagram-templates-design-b8a18ce81aabd8c8366f58e0d602220f-screen.jpg" 
                            alt="Social Media" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="pt-6">
                          <Share2 className="w-8 h-8 text-primary mx-auto mb-4" />
                          <h4 className="font-semibold mb-2">Social Media</h4>
                          <p className="text-sm text-muted-foreground">
                            Story shared on official channels
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active Missions</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Active Missions</h2>
              <Badge className="bg-primary text-white">3 Active</Badge>
            </div>
            <div className="space-y-3">
              {missions.active.map((mission, index) => (
                <MissionCard key={index} mission={mission} status="active" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Completed Missions</h2>
              <Badge className="bg-green-500 text-white">2 Completed</Badge>
            </div>
            <div className="space-y-3">
              {missions.completed.map((mission, index) => (
                <MissionCard key={index} mission={mission} status="completed" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Upcoming Missions</h2>
              <Badge className="bg-blue-500 text-white">2 Upcoming</Badge>
            </div>
            <div className="space-y-3">
              {missions.upcoming.map((mission, index) => (
                <MissionCard key={index} mission={mission} status="upcoming" />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
