"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, User, Trophy, Coins, Sun, Moon, Gift, Award } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

// Theme toggle component for navbar
const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render the toggle on the client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[100px] h-[36px]"></div>; // Placeholder with similar dimensions
  }

  return (
    <button 
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md hover:bg-primary/10 transition-colors"
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-4 h-4" />
          Light Mode
        </>
      ) : (
        <>
          <Moon className="w-4 h-4" />
          Dark Mode
        </>
      )}
    </button>
  );
};

export function TopNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  
  // Pages where profile icon should only show dropdown without redirecting
  const noRedirectPages = ['/profile', '/leaderboard', '/coins'];
  
  const handleProfileClick = () => {
    // Only redirect to dashboard if not on dashboard, profile, leaderboard, or coins pages
    if (pathname !== "/dashboard" && !noRedirectPages.includes(pathname)) {
      router.push('/dashboard');
    }
  };

  const handleNavigation = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const menuItems = [
    { label: "Dashboard", icon: <Crown className="w-4 h-4 mr-2" />, href: "/dashboard" },
    { label: "Profile", icon: <User className="w-4 h-4 mr-2" />, href: "/profile" },
    { label: "Coins & Rewards", icon: <Coins className="w-4 h-4 mr-2" />, href: "/coins" },
    { label: "Leaderboard & Missions", icon: <Trophy className="w-4 h-4 mr-2" />, href: "/leaderboard" },
  ];

  // Determine whether to show dropdown menu based on current page
  const showDropdown = pathname === "/dashboard" || noRedirectPages.includes(pathname);

  // Animation variants for dropdown items
  const dropdownVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.2,
        ease: "easeOut"
      }
    }),
    exit: { 
      opacity: 0,
      y: -5,
      transition: {
        duration: 0.1
      }
    }
  };

  return (
    <header className="border-b border-border/10 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16">
        {/* Logo on the left */}
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="Go to homepage"
          >
            <Crown className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Namma Yatri</span>
          </Link>
        </div>
      
        {/* Navigation links in the center */}
        <nav className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-6">
            <Link 
              href="/passenger"
              className="px-6 py-2.5 text-base font-medium rounded-md hover:bg-primary/10 transition-all duration-200 hover:scale-105"
            >
              Passenger
            </Link>
            <Link 
              href="/driver"
              className="px-6 py-2.5 text-base font-medium rounded-md hover:bg-primary/10 transition-all duration-200 hover:scale-105"
            >
              Driver
            </Link>
          </div>
        </nav>

        {/* Right side elements */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {showDropdown ? (
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="profile-ring relative">
                  <Avatar className="w-[45px] h-[45px] cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-105">
                    <AvatarImage src="https://i.ibb.co/Zzjqq0rk/d.png" />
                    <AvatarFallback>NY</AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-background rounded-full border-2 border-background">
                    <span className="text-xs">💠</span>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-64 p-1 rounded-xl shadow-lg border border-border/30 bg-background/95 backdrop-blur-sm"
                sideOffset={8}
              >
                <AnimatePresence>
                  {open && (
                    <>
                      {menuItems.map((item, index) => (
                        <motion.div
                          key={item.href}
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          custom={index}
                        >
                          <DropdownMenuItem 
                            className="flex items-center py-3 px-4 cursor-pointer rounded-lg hover:bg-primary/10 transition-all duration-150 focus:bg-primary/5 focus:text-primary my-1"
                            onClick={() => handleNavigation(item.href)}
                          >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                          </DropdownMenuItem>
                        </motion.div>
                      ))}
                    </>
                  )}
                </AnimatePresence>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button 
              onClick={handleProfileClick}
              className="profile-ring relative"
            >
              <Avatar className="w-[45px] h-[45px] cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-105">
                <AvatarImage src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=120&h=120&fit=crop" />
                <AvatarFallback>NY</AvatarFallback>
              </Avatar>
              <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-background rounded-full border-2 border-background">
                <span className="text-xs">💠</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}