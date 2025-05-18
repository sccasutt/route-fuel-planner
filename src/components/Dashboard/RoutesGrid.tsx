
import React from "react";
import { RouteCard } from "./RouteCard";
import { getRouteCoordinates } from "@/utils/routeCoordinatesUtils";

interface RoutesGridProps {
  activities: any[];
  routeCoordinatesMap?: Record<string, [number, number][]>;
}

export function RoutesGrid({ activities, routeCoordinatesMap = {} }: RoutesGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {activities.map((activity, index) => {
        // Get coordinates either from the map or generate them
        const routeCoordinates = routeCoordinatesMap[activity.id] || 
          getRouteCoordinates(index, activities, routeCoordinatesMap);
        
        return (
          <RouteCard
            key={activity.id}
            id={activity.id}
            name={activity.name}
            date={activity.date}
            distance={activity.distance}
            elevation={activity.elevation}
            duration={activity.duration}
            calories={activity.calories}
            routeCoordinates={routeCoordinates}
            type={activity.type}
            gpxFileUrl={activity.gpx_file_url}
          />
        );
      })}
    </div>
  );
}
