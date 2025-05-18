
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

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {activities.map((activity) => (
        <Card key={activity.id}>
          <CardHeader>
            <CardTitle>{activity.name}</CardTitle>
            <CardDescription>{activity.date}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex items-center">
              <span className="text-sm font-medium">Distance:</span>
              <span className="ml-1 text-sm text-muted-foreground">
                {formatDistance(activity.distance)} km
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
