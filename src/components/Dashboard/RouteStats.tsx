
import React from "react";
import { Map, TrendingUp, Clock, LineChart } from "lucide-react";

interface RouteStatsProps {
  distance: number;
  elevation: number;
  duration: string;
  calories: number;
}

export function RouteStats({ distance, elevation, duration, calories }: RouteStatsProps) {
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
    </div>
  );
}
