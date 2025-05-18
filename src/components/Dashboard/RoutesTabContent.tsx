
import React, { useEffect } from "react";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { WahooActivityData } from "@/hooks/wahoo/wahooTypes";
import { formatDistance, formatElevation } from "@/lib/utils";
import { formatHumanReadableDuration } from "@/lib/durationFormatter";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, AlertCircle } from "lucide-react";
import RouteMap from "../Map/RouteMap";

interface RoutesTabContentProps {
  activities: WahooActivityData[];
}

export function RoutesTabContent({ activities }: RoutesTabContentProps) {
  useEffect(() => {
    // Add debug logging to help identify issues
    console.log("RoutesTabContent rendered with", activities?.length || 0, "activities");
    if (activities && activities.length > 0) {
      console.log("First activity sample:", {
        id: activities[0].id,
        name: activities[0].name,
        hasCoordinates: activities[0].coordinates?.length || 0
      });
    }
  }, [activities]);

  if (!activities) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Loading Routes</CardTitle>
          <CardDescription>
            Please wait while we fetch your route data...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            No Routes Available
          </CardTitle>
          <CardDescription>
            No routes have been synced yet. Connect your Wahoo account to start
            importing your activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Once you connect your account, your routes will appear here.</p>
          <p className="text-sm text-muted-foreground">
            If you've already connected your account and still don't see routes, try:
            <ul className="list-disc pl-5 mt-2">
              <li>Refreshing your data from the dashboard</li>
              <li>Checking your Wahoo connection status</li>
              <li>Ensuring you have routes in your Wahoo account</li>
            </ul>
          </p>
        </CardContent>
      </Card>
    );
  }

  // Display the most recent activity map
  const mostRecentActivity = activities[0];

  // Generate different route shapes for variety
  const getRouteCoordinates = (index: number): [number, number][] => {
    // Base center point
    const basePoint: [number, number] = [51.505, -0.09];
    
    // Different route shapes based on index
    const sampleRouteCoordinates: [number, number][] = [
      [51.505, -0.09],
      [51.51, -0.1],
      [51.52, -0.12],
      [51.518, -0.14],
      [51.51, -0.15],
      [51.5, -0.14],
      [51.495, -0.12],
      [51.505, -0.09],
    ];
    
    // If activity has coordinates, try to use them
    if (activities[index % activities.length]?.coordinates && 
        Array.isArray(activities[index % activities.length].coordinates) && 
        activities[index % activities.length].coordinates!.length >= 2) {
      return activities[index % activities.length].coordinates as [number, number][];
    }
    
    // Different route shapes based on index
    switch (index % 3) {
      case 0: // circular
        return sampleRouteCoordinates;
      case 1: // out and back
        return [
          [basePoint[0], basePoint[1]],
          [basePoint[0] + 0.02, basePoint[1] + 0.02],
          [basePoint[0] + 0.04, basePoint[1] + 0.01],
          [basePoint[0] + 0.06, basePoint[1] + 0.03],
          [basePoint[0] + 0.06, basePoint[1] + 0.03], // turning point
          [basePoint[0] + 0.04, basePoint[1] + 0.01],
          [basePoint[0] + 0.02, basePoint[1] + 0.02],
          [basePoint[0], basePoint[1]],
        ];
      case 2: // triangle
        return [
          [basePoint[0], basePoint[1]],
          [basePoint[0] + 0.03, basePoint[1] + 0.05],
          [basePoint[0] - 0.03, basePoint[1] + 0.02],
          [basePoint[0], basePoint[1]],
        ];
      default:
        return sampleRouteCoordinates;
    }
  };

  return (
    <div className="space-y-6">
      {/* Featured Route Map */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Route</CardTitle>
          <CardDescription>
            {mostRecentActivity.name} - {mostRecentActivity.date}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[300px] w-full relative">
            <RouteMap
              center={[51.505, -0.09]}
              zoom={12}
              height="100%"
              className="rounded-b-lg"
              showControls={true}
              routeCoordinates={getRouteCoordinates(0)}
              mapStyle="terrain"
              routeStyle={{
                color: "#8B5CF6", // Vivid purple
                weight: 5,
                opacity: 0.85
              }}
            />
            <div className="absolute bottom-4 right-4">
              <Link to={`/routes/${mostRecentActivity.id}`}>
                <Button size="sm" className="gap-2">
                  <MapPin className="h-4 w-4" /> View Details <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Cards List */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity, index) => (
          <Card key={activity.id} className="overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{activity.name}</CardTitle>
              <CardDescription>{activity.date}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div className="h-[120px] w-full mb-2">
                <RouteMap
                  center={[51.505, -0.09]}
                  zoom={11}
                  height="100%"
                  className="rounded-md border border-border/50"
                  showControls={false}
                  routeCoordinates={getRouteCoordinates(index)}
                  mapStyle={index % 2 === 0 ? "default" : "dark"}
                  routeStyle={{
                    color: index % 3 === 0 ? "#8B5CF6" : index % 3 === 1 ? "#0EA5E9" : "#F97316", 
                    weight: 3,
                    opacity: 0.8
                  }}
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium">Distance:</span>
                <span className="ml-1 text-sm text-muted-foreground">
                  {typeof activity.distance === 'number' ? activity.distance.toFixed(1) : '0.0'} km
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium">Elevation:</span>
                <span className="ml-1 text-sm text-muted-foreground">
                  {formatElevation(activity.elevation)} m
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium">Duration:</span>
                <span className="ml-1 text-sm text-muted-foreground">
                  {formatHumanReadableDuration(activity.duration_seconds || 0)}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium">Calories:</span>
                <span className="ml-1 text-sm text-muted-foreground">
                  {activity.calories} kcal
                </span>
              </div>
              <Link to={`/routes/${activity.id}`} className="mt-2">
                <Button variant="ghost" size="sm" className="gap-1">
                  View Details <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
