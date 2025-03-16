"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Settings, 
  User, 
  LogOut, 
  Sun, 
  Moon, 
  Target, 
  Gift, 
  MapPin, 
  Crown, 
  Trophy,
  Home,
  CreditCard,
  HelpCircle,
  Bell,
  Shield,
  Edit,
  Car,
  FileText,
  Key
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect } from "react";

export function ProfileMenu() {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Function to handle option selection
  const handleOptionSelect = useCallback((option: string) => {
    setIsOpen(false); // Close dropdown
    
    // Use setTimeout to ensure dropdown closes before navigation
    setTimeout(() => {
      if (option === 'dashboard') {
        // For dashboard, just clear any query parameters
        if (pathname === '/dashboard') {
          // If already on dashboard with query params, replace URL to clear them
          if (window.location.search) {
            router.replace('/dashboard');
          }
          // Otherwise do nothing - we're already on the dashboard
        } else {
          // Navigate to dashboard if not already there
          router.push('/dashboard');
        }
      } else {
        // For other options, navigate to dashboard with section parameter
        router.push(`/dashboard?section=${option}`);
      }
    }, 100);
  }, [router, pathname]);

  // Function to handle dashboard navigation
  const handleDashboardClick = useCallback(() => {
    setIsOpen(false);
    
    // Only navigate if not already on the dashboard page without query params
    if (pathname !== '/dashboard' || window.location.search) {
      setTimeout(() => {
        router.replace('/dashboard');
      }, 100);
    }
  }, [router, pathname]);

  const handleLogout = () => {
    setIsOpen(false);
    // Add your logout logic here
    console.log('Logging out...');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="profile-ring relative outline-none">
          <Avatar className="w-[45px] h-[45px] cursor-pointer hover:opacity-90 transition-opacity">
            <AvatarImage src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=120&h=120&fit=crop" />
            <AvatarFallback>NY</AvatarFallback>
          </Avatar>
          {/* Tier badge on profile image */}
          <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-background rounded-full border-2 border-background">
            <span className="text-xs">💠</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <AnimatePresence>
        <DropdownMenuContent 
          align="end" 
          className="w-56 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <DropdownMenuLabel className="flex items-center gap-2 p-4">
            <User className="w-4 h-4" />
            <div>
              <p className="font-semibold">Rahul Singh</p>
              <p className="text-xs text-muted-foreground">Driver ID: NY123456</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div className="p-2">
            <DropdownMenuItem onClick={handleDashboardClick} className="gap-2">
              <Home className="w-4 h-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOptionSelect('profile')} className="gap-2">
              <User className="w-4 h-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOptionSelect('coins')} className="gap-2">
              <Gift className="w-4 h-4" />
              Coins
              <Badge variant="outline" className="ml-auto bg-accent/20 text-xs">2</Badge>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOptionSelect('leaderboard')} className="gap-2">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOptionSelect('hotspots')} className="gap-2">
              <MapPin className="w-4 h-4" />
              Hotspots
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />
          
          <div className="p-2">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                <DropdownMenuItem onClick={() => handleOptionSelect('edit-profile')} className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOptionSelect('vehicle-info')} className="gap-2">
                  <Car className="w-4 h-4" />
                  Vehicle Information
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOptionSelect('documents')} className="gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOptionSelect('security')} className="gap-2">
                  <Key className="w-4 h-4" />
                  Security Settings
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuItem onClick={() => handleOptionSelect('payments')} className="gap-2">
              <CreditCard className="w-4 h-4" />
              Payments
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOptionSelect('notifications')} className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
              <Badge variant="outline" className="ml-auto bg-red-500/20 text-xs">5</Badge>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOptionSelect('help')} className="gap-2">
              <HelpCircle className="w-4 h-4" />
              Help & Support
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="gap-2"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-500 hover:text-red-500 p-2">
            <LogOut className="w-4 h-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </AnimatePresence>
    </DropdownMenu>
  );
}