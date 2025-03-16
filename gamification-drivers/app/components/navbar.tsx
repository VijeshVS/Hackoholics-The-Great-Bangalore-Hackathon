"use client";

import { Home, User, Trophy, Coins } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export function Navbar() {
  const pathname = usePathname();
  
  const navItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
    { icon: Coins, label: "Coins", href: "/coins" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border/20 z-40 flex items-center justify-center">
      <div className="w-full max-w-md flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-20 h-full"
            >
              <div className="flex flex-col items-center justify-center">
                {isActive ? (
                  <>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-1"
                    >
                      <Icon className="w-5 h-5 text-primary" />
                    </motion.div>
                    <span className="text-xs font-medium text-primary">{item.label}</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-10 h-10 mb-1">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </>
                )}
              </div>
              
              {isActive && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute top-0 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
