import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { 
  Sun, Moon, CloudRain, Car, Clock, 
  DollarSign, CreditCard, Wallet, Gift 
} from 'lucide-react';

interface FareDetails {
  baseFare: number;
  perKmRate: number;
  distance: number;
  duration: string;
  peakHourSurcharge: number;
  rainCharge: number;
  nightCharge: number;
  tollCharges: number;
}

interface FareCalculatorProps {
  distance: string;
  duration: string;
  onTipChange: (amount: number) => void;
  onPaymentComplete: () => void;
}

export function FareCalculator({ 
  distance, 
  duration, 
  onTipChange, 
  onPaymentComplete 
}: FareCalculatorProps) {
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState(false);
  const [fareDetails, setFareDetails] = useState<FareDetails>({
    baseFare: 30,
    perKmRate: 15,
    distance: parseFloat(distance.replace(' km', '')),
    duration: duration,
    peakHourSurcharge: 0,
    rainCharge: 0,
    nightCharge: 0,
    tollCharges: 0
  });

  // Check for peak hours (8-10 AM and 5-8 PM)
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    
    setFareDetails(prev => ({
      ...prev,
      peakHourSurcharge: isPeakHour ? prev.baseFare * 0.2 : 0
    }));
  }, []);

  // Check for night charges (11 PM - 5 AM)
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const isNightTime = hour >= 23 || hour <= 5;
    
    setFareDetails(prev => ({
      ...prev,
      nightCharge: isNightTime ? prev.baseFare * 0.15 : 0
    }));
  }, []);

  // Fetch weather data and apply rain charges
  useEffect(() => {
    const checkWeather = async () => {
      try {
        const response = await fetch(
          'https://api.openweathermap.org/data/2.5/weather?q=Bangalore&appid=YOUR_API_KEY'
        );
        const data = await response.json();
        const isRaining = data.weather[0].main === 'Rain';
        
        setFareDetails(prev => ({
          ...prev,
          rainCharge: isRaining ? prev.baseFare * 0.1 : 0
        }));
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };
    
    checkWeather();
  }, []);

  const calculateTotalFare = () => {
    const { 
      baseFare, 
      perKmRate, 
      distance, 
      peakHourSurcharge, 
      rainCharge, 
      nightCharge, 
      tollCharges 
    } = fareDetails;

    const distanceFare = distance * perKmRate;
    const subtotal = baseFare + distanceFare;
    const total = subtotal + peakHourSurcharge + rainCharge + nightCharge + tollCharges + tip;

    return {
      subtotal: Math.round(subtotal),
      total: Math.round(total)
    };
  };

  const handleTipSelection = (amount: number) => {
    setTip(amount);
    setCustomTip(false);
    onTipChange(amount);
  };

  const handleCustomTipChange = (value: number[]) => {
    const tipAmount = value[0];
    setTip(tipAmount);
    onTipChange(tipAmount);
  };

  const { subtotal, total } = calculateTotalFare();

  return (
    <Card className="p-6 glass-card space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">
          Fare Breakdown
        </h3>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Base Fare</span>
            <span className="font-medium">₹{fareDetails.baseFare}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Distance Charge</span>
            <span className="font-medium">
              ₹{Math.round(fareDetails.distance * fareDetails.perKmRate)}
              <span className="text-xs text-muted-foreground ml-1">
                ({fareDetails.distance} km × ₹{fareDetails.perKmRate}/km)
              </span>
            </span>
          </div>

          {fareDetails.peakHourSurcharge > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Peak Hour Surcharge</span>
              </div>
              <span className="font-medium">₹{Math.round(fareDetails.peakHourSurcharge)}</span>
            </motion.div>
          )}

          {fareDetails.rainCharge > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Rain Charge</span>
              </div>
              <span className="font-medium">₹{Math.round(fareDetails.rainCharge)}</span>
            </motion.div>
          )}

          {fareDetails.nightCharge > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-muted-foreground">Night Charge</span>
              </div>
              <span className="font-medium">₹{Math.round(fareDetails.nightCharge)}</span>
            </motion.div>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">Subtotal</span>
            <span className="font-semibold">₹{subtotal}</span>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Add a Tip</h4>
            
            <div className="flex gap-2">
              {[10, 20, 50].map((amount) => (
                <Button
                  key={amount}
                  variant={tip === amount ? "default" : "outline"}
                  className="flex-1 transition-all duration-300"
                  onClick={() => handleTipSelection(amount)}
                >
                  ₹{amount}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <button
                className="text-sm text-primary hover:underline"
                onClick={() => setCustomTip(!customTip)}
              >
                {customTip ? "Hide custom tip" : "Add custom tip"}
              </button>

              <AnimatePresence>
                {customTip && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2"
                  >
                    <Slider
                      defaultValue={[tip]}
                      max={200}
                      step={10}
                      onValueChange={handleCustomTipChange}
                    />
                    <div className="text-sm text-muted-foreground text-center">
                      Custom tip: ₹{tip}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex justify-between items-center mb-6">
            <span className="font-semibold">Total Fare</span>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">
              ₹{total}
            </span>
          </div>

          <div className="space-y-2">
            <Button 
              className="w-full button-hover"
              onClick={onPaymentComplete}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Payment
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
              <CreditCard className="w-3 h-3" />
              <Wallet className="w-3 h-3" />
              <span>Multiple payment options available</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 