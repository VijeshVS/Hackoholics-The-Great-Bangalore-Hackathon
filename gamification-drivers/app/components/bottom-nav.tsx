"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Car, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 backdrop-blur-lg bg-opacity-50 z-100">
      <div className="container mx-auto max-w-lg">
        <div className="flex justify-around items-center">
          <Link 
            href="/passenger" 
            className={`relative flex flex-col items-center gap-1 transition-colors ${
              isActive('/passenger') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <User className="h-6 w-6" />
            <span className="text-xs font-medium">Passenger</span>
            {isActive('/passenger') && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-4 h-1 w-12 bg-primary rounded-full"
              />
            )}
          </Link>

          <Link 
            href="/driver" 
            className={`relative flex flex-col items-center gap-1 transition-colors ${
              isActive('/driver') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <Car className="h-6 w-6" />
            <span className="text-xs font-medium">Driver</span>
            {isActive('/driver') && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-4 h-1 w-12 bg-primary rounded-full"
              />
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
