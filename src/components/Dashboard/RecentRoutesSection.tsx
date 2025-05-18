
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Map, TrendingUp, Clock, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatDuration, ensureValidDuration } from "@/lib/utils";
import { secondsToTimeString } from "@/hooks/wahoo/activityFormatUtils";

interface RouteType {
  id: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  duration_seconds?: number | null;
  calories: number;
}

interface Props {
  routes: RouteType[];
}

export function RecentRoutesSection({ routes }: Props) {
  return (
    <div className="p-6 bg-muted rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Routes</h2>
        <Link to="/routes">
          <Button variant="outline" size="sm">View All</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routes.map((route) => {
          // Prefer numeric duration if available, otherwise use text-based duration
          const displayDuration = route.duration_seconds && route.duration_seconds > 0
            ? formatDuration(secondsToTimeString(route.duration_seconds))
            : formatDuration(ensureValidDuration(route.duration));
          
          return (
            <Card key={route.id} className="overflow-hidden">
              <div className="h-2 bg-primary" />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{route.name}</CardTitle>
                <CardDescription>{route.date}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <Map className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{route.distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{route.elevation.toFixed(0)} m</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{displayDuration}</span>
                  </div>
                  <div className="flex items-center">
                    <LineChart className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{route.calories} kcal</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/routes/${route.id}`}>
                  <Button variant="ghost" size="sm">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
