"use client";

import { ThemeProvider } from '@/components/theme-provider';
import { TopNavbar } from "./components/top-navbar";
import { Navbar } from "./components/navbar";
import { Toaster } from "./components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <TopNavbar />
      <div className="pt-16 pb-20">
        {children}
      </div>
      <Navbar />
      <Toaster />
    </ThemeProvider>
  );
}