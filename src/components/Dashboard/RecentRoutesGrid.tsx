
import React from "react";
import { RouteCard } from "./RouteCard";
import { RouteType } from "@/types/route";

interface RecentRoutesGridProps {
  routes: RouteType[];
  routeCoordinates?: Record<string, [number, number][]>;
  maxItems?: number;
}

export function RecentRoutesGrid({ 
  routes, 
  routeCoordinates = {},
  maxItems = 3
}: RecentRoutesGridProps) {
  // Take only the specified number of routes to display
  const displayedRoutes = routes.slice(0, maxItems);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {displayedRoutes.map((route) => (
        <RouteCard
          key={route.id}
          id={route.id}
          name={route.name}
          date={route.date}
          distance={route.distance}
          elevation={route.elevation}
          duration={route.duration}
          calories={route.calories}
          routeCoordinates={routeCoordinates[route.id] || []}
          type={route.type}
          gpxFileUrl={route.gpx_file_url}
        />
      ))}
    </div>
  );
}
