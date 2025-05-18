
import React from "react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { RouteMapPreview } from "./RouteMapPreview";
import { RouteStats } from "./RouteStats";
import { formatShortDate } from "@/lib/utils";

interface RouteCardProps {
  id: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  calories: number;
  routeCoordinates: [number, number][];
  type?: string;
  gpxFileUrl?: string | null;
}

export function RouteCard({
  id,
  name,
  date,
  distance,
  elevation,
  duration,
  calories,
  routeCoordinates = [],
  type = "activity",
  gpxFileUrl
}: RouteCardProps) {
  const hasValidCoordinates = routeCoordinates && routeCoordinates.length >= 2;
  
  return (
    <Card className="overflow-hidden">
      <Link to={`/route/${id}`} className="block">
        <div className="relative">
          <RouteMapPreview 
            routeCoordinates={routeCoordinates} 
            hasValidCoordinates={hasValidCoordinates} 
            routeType={type} 
          />
        </div>
        
        <div className="p-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium truncate mr-2">{name}</h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatShortDate(date)}
            </span>
          </div>
          
          <RouteStats 
            distance={distance} 
            elevation={elevation} 
            duration={duration} 
            calories={calories} 
            type={type} 
          />
          
          {gpxFileUrl && (
            <div className="mt-2 text-xs text-primary hover:underline">
              <a 
                href={gpxFileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Download GPX
              </a>
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
}
