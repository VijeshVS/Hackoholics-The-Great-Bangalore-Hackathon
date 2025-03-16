"use client";

import { useRouter, usePathname } from "next/navigation";
import { Crown, Coins, Star, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProfileMenu } from "./profile-menu";
import { ThemeToggle } from "./theme-toggle";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="border-b border-border/10 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.push('/home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="Go to homepage"
          >
            <Crown className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Namma Yatri</span>
          </button>
        </div>
      
        <div className="flex items-center gap-4">
          {pathname === '/dashboard' && (
            <>
              <Badge variant="outline" className="text-sm badge-animation">
                <Coins className="w-4 h-4 mr-1 text-accent" />
                2,450 Coins
              </Badge>
              <Badge variant="secondary" className="text-sm badge-animation">
                <Star className="w-4 h-4 mr-1 text-primary" />
                2,750 XP
              </Badge>
              <Badge variant="outline" className="text-sm badge-animation">
                <Flame className="w-4 h-4 mr-1 text-red-500" />
                28 Day Streak
              </Badge>
            </>
          )}
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
} 