
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
  
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex items-center">
        <Map className="w-4 h-4 mr-2 text-muted-foreground" />
        <span className="text-sm">{distance.toFixed(1)} km</span>
      </div>
      <div className="flex items-center">
        <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
        <span className="text-sm">{Math.round(elevation)} m</span>
      </div>
      <div className="flex items-center">
        <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
        <span className="text-sm">{duration}</span>
      </div>
      <div className="flex items-center">
        <LineChart className="w-4 h-4 mr-2 text-muted-foreground" />
        <span className="text-sm">{calories || 0} kcal</span>
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
