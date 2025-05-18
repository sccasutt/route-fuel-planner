
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RouteCard } from "./RouteCard";

interface RouteType {
  id: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  duration_seconds?: number | null;
  calories: number;
  gpx_data?: string | null;
}

interface RoutesGridProps {
  routes: RouteType[];
  routeCoordinates: Record<string, [number, number][]>;
}

export function RoutesGrid({ routes, routeCoordinates }: RoutesGridProps) {
  return (
    <div className="p-6 bg-muted rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Routes</h2>
        <Link to="/routes">
          <Button variant="outline" size="sm">View All</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routes.map((route) => (
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
          />
        ))}
      </div>
    </div>
  );
}
