
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Map, TrendingUp, Clock, LineChart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatHumanReadableDuration } from "@/lib/durationFormatter";
import RouteMap from "../Map/RouteMap";

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
  // Get the most recent route for the featured map
  const mostRecentRoute = routes.length > 0 ? routes[0] : null;

  return (
    <div className="space-y-6">
      {/* Featured Route Map */}
      {mostRecentRoute && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-primary" />
              Latest Route Map
            </CardTitle>
            <CardDescription>{mostRecentRoute.name} - {mostRecentRoute.date}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[240px] w-full">
              <RouteMap
                center={[51.505, -0.09]} {/* This would be replaced with actual coordinates */}
                zoom={12}
                height="100%"
                className="rounded-none"
                showControls={true}
              />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50">
            <Link to={`/routes/${mostRecentRoute.id}`}>
              <Button variant="outline" size="sm">View Full Details</Button>
            </Link>
          </CardFooter>
        </Card>
      )}

      {/* Routes List */}
      <div className="p-6 bg-muted rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Routes</h2>
          <Link to="/routes">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {routes.map((route) => {
            // Use human readable format for duration
            const displayDuration = formatHumanReadableDuration(route.duration_seconds || 0);
            
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
                      <span className="text-sm">{(route.distance/1000).toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{Math.round(route.elevation)} m</span>
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
    </div>
  );
}
