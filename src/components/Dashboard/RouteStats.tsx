
import React from "react";
import { Map, TrendingUp, Clock, LineChart, Tag } from "lucide-react";

interface RouteStatsProps {
  distance: number;
  elevation: number;
  duration: string;
  calories: number;
  type?: string;
}

export function RouteStats({ distance, elevation, duration, calories, type }: RouteStatsProps) {
  // Format the route type for display
  const displayType = type ? type.charAt(0).toUpperCase() + type.slice(1) : "Activity";
  
  // Ensure numeric values are valid
  const safeDistance = typeof distance === 'number' && !isNaN(distance) ? distance : 0;
  const safeElevation = typeof elevation === 'number' && !isNaN(elevation) ? elevation : 0;
  const safeCalories = typeof calories === 'number' && !isNaN(calories) ? calories : 0;
  
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex items-center">
        <Map className="w-4 h-4 mr-2 text-muted-foreground" />
        <span className="text-sm">{safeDistance.toFixed(1)} km</span>
      </div>
      <div className="flex items-center">
        <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
        <span className="text-sm">{Math.round(safeElevation)} m</span>
      </div>
      <div className="flex items-center">
        <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
        <span className="text-sm">{duration || "00:00"}</span>
      </div>
      <div className="flex items-center">
        <LineChart className="w-4 h-4 mr-2 text-muted-foreground" />
        <span className="text-sm">{safeCalories || 0} kcal</span>
      </div>
      {type && (
        <div className="flex items-center col-span-2 mt-1">
          <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{displayType}</span>
        </div>
      )}
    </div>
  );
}
