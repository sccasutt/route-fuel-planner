
import React from "react";
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
import { MapPin, ArrowRight } from "lucide-react";
import RouteMap from "../Map/RouteMap";

interface RoutesTabContentProps {
  activities: WahooActivityData[];
}

export function RoutesTabContent({ activities }: RoutesTabContentProps) {
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Routes Available</CardTitle>
          <CardDescription>
            No routes have been synced yet. Connect your Wahoo account to start
            importing your activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Once you connect your account, your routes will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  // Display the most recent activity map
  const mostRecentActivity = activities[0];

  // Sample route coordinates - in a real app, these would come from the route data
  // This is just a sample circular route around London for demonstration
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
              routeCoordinates={sampleRouteCoordinates}
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
        {activities.map((activity) => (
          <Card key={activity.id} className="overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{activity.name}</CardTitle>
              <CardDescription>{activity.date}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div className="flex items-center">
                <span className="text-sm font-medium">Distance:</span>
                <span className="ml-1 text-sm text-muted-foreground">
                  {activity.distance.toFixed(1)} km
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
