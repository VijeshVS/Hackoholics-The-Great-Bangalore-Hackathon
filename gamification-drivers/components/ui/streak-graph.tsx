"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function StreakGraph() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Generate sample data for the heatmap
  const generateHeatMapData = () => {
    const data = [];
    const daysInMonth = new Date(2023, selectedMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      data.push({
        date: new Date(2023, selectedMonth, i),
        value: Math.floor(Math.random() * 5)
      });
    }
    return data;
  };

  const heatMapData = generateHeatMapData();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {new Date(2023, selectedMonth).toLocaleString('default', { month: 'long' })} 2023
        </p>
        <Select
          value={selectedMonth.toString()}
          onValueChange={(value) => setSelectedMonth(parseInt(value))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i} value={i.toString()}>
                {new Date(2023, i).toLocaleString('default', { month: 'long' })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {heatMapData.map((day, index) => (
          <div
            key={index}
            className={`w-full aspect-square rounded streak-cell streak-cell-${day.value}`}
            title={`${day.date.toLocaleDateString()}: ${day.value} rides`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="streak-cell streak-cell-0 w-3 h-3" />
          <span>0 rides</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="streak-cell streak-cell-4 w-3 h-3" />
          <span>10+ rides</span>
        </div>
      </div>
    </div>
  );
} 