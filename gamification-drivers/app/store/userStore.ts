'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the available tier levels
export type TierLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Crown';

export interface TierInfo {
  name: TierLevel;
  icon: string;
  requiredLevel: number;
  color?: string;
}

export const tierLevels: TierInfo[] = [
  { name: 'Bronze', icon: '🥉', requiredLevel: 0, color: 'text-orange-400' },
  { name: 'Silver', icon: '🥈', requiredLevel: 50, color: 'text-slate-400' },
  { name: 'Gold', icon: '🥇', requiredLevel: 100, color: 'text-yellow-500' },
  { name: 'Platinum', icon: '💎', requiredLevel: 150, color: 'text-cyan-400' },
  { name: 'Diamond', icon: '💠', requiredLevel: 200, color: 'text-blue-400' },
  { name: 'Crown', icon: '👑', requiredLevel: 250, color: 'text-purple-500' }
];

interface UserStore {
  // User stats
  totalCoins: number;
  currentLevel: number;
  currentTier: TierInfo;
  driverScore: number;
  
  // Methods
  addLevel: (amount: number) => void;
  addCoins: (amount: number) => void;
  getCurrentTierProgress: () => number;
  getLevelsToNextTier: () => number;
  calculateTier: (level: number) => TierInfo;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Initialize with default values
      totalCoins: 10000,
      currentLevel: 47,
      driverScore: 4.92,
      currentTier: tierLevels[0], // Start at Bronze tier
      
      calculateTier: (level) => {
        // Determine tier based on level
        for (let i = tierLevels.length - 1; i >= 0; i--) {
          if (level >= tierLevels[i].requiredLevel) {
            return tierLevels[i];
          }
        }
        return tierLevels[0]; // Default to Bronze if no match
      },
      
      addLevel: (amount) => {
        set((state) => {
          const newLevel = state.currentLevel + amount;
          // Calculate new tier based on level
          const newTier = get().calculateTier(newLevel);
          
          return {
            currentLevel: newLevel,
            currentTier: newTier
          };
        });
      },
      
      addCoins: (amount) => {
        set((state) => ({
          totalCoins: state.totalCoins + amount
        }));
      },
      
      getCurrentTierProgress: () => {
        const { currentLevel, currentTier } = get();
        
        // Find the next tier's level requirement
        const currentTierIndex = tierLevels.findIndex(tier => tier.name === currentTier.name);
        const nextTierIndex = Math.min(currentTierIndex + 1, tierLevels.length - 1);
        
        if (currentTierIndex === tierLevels.length - 1) {
          // Already at max tier
          return 100;
        }
        
        const currentTierLevel = tierLevels[currentTierIndex].requiredLevel;
        const nextTierLevel = tierLevels[nextTierIndex].requiredLevel;
        
        // Calculate progress percentage
        const levelProgress = currentLevel - currentTierLevel;
        const levelsRequired = nextTierLevel - currentTierLevel;
        
        return Math.min(Math.floor((levelProgress / levelsRequired) * 100), 100);
      },
      
      getLevelsToNextTier: () => {
        const { currentLevel, currentTier } = get();
        
        // Find the next tier's level requirement
        const currentTierIndex = tierLevels.findIndex(tier => tier.name === currentTier.name);
        const nextTierIndex = Math.min(currentTierIndex + 1, tierLevels.length - 1);
        
        if (currentTierIndex === tierLevels.length - 1) {
          // Already at max tier
          return 0;
        }
        
        const nextTierLevel = tierLevels[nextTierIndex].requiredLevel;
        return Math.max(nextTierLevel - currentLevel, 0);
      }
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        totalCoins: state.totalCoins,
        currentLevel: state.currentLevel,
        currentTier: state.currentTier,
        driverScore: state.driverScore
      }),
    }
  )
);
