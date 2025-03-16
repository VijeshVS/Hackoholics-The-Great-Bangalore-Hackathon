"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Star, SquareChevronRight, Award, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gradient background */}
      <div className="gradient-bg" />

      <div className="container mx-auto py-12 px-4 relative">
        <section className="mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
              Welcome to Namma Yatri
            </h1>
            <p className="text-xl mb-8 text-muted-foreground">
              Your trusted platform for convenient, affordable, and safe rides across India.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
              <Button 
                size="lg"
                onClick={() => router.push("/")}
                className="button-hover rounded-xl h-14 text-lg px-8 flex items-center gap-2"
              >
                <Users className="h-5 w-5" />
                Book A Ride
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => router.push("/driver")}
                className="border border-primary/20 rounded-xl h-14 text-lg px-8 flex items-center gap-2 backdrop-blur-sm hover:bg-primary/10"
              >
                {/* Using Users icon instead of Taxi since Taxi is not available */}
                <Users className="h-5 w-5" />
                Drive With Us
              </Button>
            </div>
          </motion.div>
        </section>

        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold mb-12 text-center">Why Choose Namma Yatri?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 glass-card rounded-3xl border-white/20 hover:border-primary/30 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="mb-5 w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Star className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Top-Rated Service</h3>
                <p className="text-muted-foreground">Enjoy rides with our highly-rated drivers, committed to providing exceptional service and comfort.</p>
              </Card>
              
              <Card className="p-8 glass-card rounded-3xl border-white/20 hover:border-primary/30 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="mb-5 w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Safe & Secure</h3>
                <p className="text-muted-foreground">Your safety is our priority with verified drivers, real-time tracking, and emergency assistance.</p>
              </Card>
              
              <Card className="p-8 glass-card rounded-3xl border-white/20 hover:border-primary/30 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="mb-5 w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Award className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Fair Pricing</h3>
                <p className="text-muted-foreground">Transparent fare calculation with no hidden charges, ensuring you get the best value for your money.</p>
              </Card>
            </div>
          </motion.div>
        </section>

        <section className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
            <p className="text-xl mb-8 text-muted-foreground">
              Join thousands of satisfied users who rely on Namma Yatri daily for their transportation needs.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg"
                onClick={() => router.push("/")} 
                className="button-hover rounded-xl py-6 px-8 text-lg gap-2 group"
              >
                Book Your First Ride
                <SquareChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        </section>
      </div>
      
      <footer className="py-8 border-t border-white/10 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Star className="h-6 w-6 text-primary mr-2" />
              <span className="font-semibold">Namma Yatri</span>
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Namma Yatri. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
