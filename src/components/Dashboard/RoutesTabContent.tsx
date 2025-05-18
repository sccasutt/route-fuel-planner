import React, { useEffect } from "react";
import { FeaturedRouteMap } from "./FeaturedRouteMap";
import { EmptyRoutesState } from "./EmptyRoutesState";
import { RoutesGrid } from "./RoutesGrid";
import { RoutesLoadingState } from "./RoutesLoadingState";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WahooActivityData } from "@/hooks/wahoo/wahooTypes";
import { RouteType } from "@/types/route";

interface RoutesTabContentProps {
  activities: RouteType[];
  routeCoordinatesMap?: Record<string, [number, number][]>;
  isLoading?: boolean;
}

export function RoutesTabContent({ 
  activities = [], 
  routeCoordinatesMap = {},
  isLoading = false
}: RoutesTabContentProps) {
  useEffect(() => {
    // Add debug logging to help identify issues
    console.log("RoutesTabContent rendered with", activities?.length || 0, "activities");
    if (activities && activities.length > 0) {
      console.log("First activity sample:", {
        id: activities[0].id,
        name: activities[0].name,
        hasCoordinates: activities[0].coordinates?.length || 0,
        mapCoordinates: routeCoordinatesMap[activities[0].id]?.length || 0
      });
    }
  }, [activities, routeCoordinatesMap]);

  if (isLoading) {
    return <RoutesLoadingState />;
  }

  if (!activities || activities.length === 0) {
    return <EmptyRoutesState />;
  }

  // Display the most recent activity map
  const mostRecentActivity = activities[0];
  const mostRecentCoordinates = routeCoordinatesMap[mostRecentActivity.id] || [];

  return (
    <div className="space-y-6">
      {/* Featured Route Map */}
      <FeaturedRouteMap 
        route={mostRecentActivity} 
        routeCoordinates={mostRecentCoordinates}
      />

      {/* Route Cards List */}
      <RoutesGrid 
        activities={activities} 
        routeCoordinatesMap={routeCoordinatesMap}
      />
    </div>
  );
}
