
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Map, TrendingUp, Clock, LineChart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatHumanReadableDuration } from "@/lib/durationFormatter";
import RouteMap from "../Map/RouteMap";
import { useState, useEffect } from "react";

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

interface Props {
  routes: RouteType[];
}

export function RecentRoutesSection({ routes }: Props) {
  // Get the most recent route for the featured map
  const mostRecentRoute = routes.length > 0 ? routes[0] : null;
  const [routeCoordinates, setRouteCoordinates] = useState<Record<string, [number, number][]>>({});

  useEffect(() => {
    // Extract real GPS coordinates from the routes' gpx_data
    const extractCoordinates = () => {
      const newCoordinates: Record<string, [number, number][]> = {};
      
      routes.forEach(route => {
        let routeCoords: [number, number][] = [];
        
        // Try to parse GPX data if available
        if (route.gpx_data) {
          try {
            // Handle both string and object formats
            const parsed = typeof route.gpx_data === 'string' 
              ? JSON.parse(route.gpx_data) 
              : route.gpx_data;
              
            if (parsed.coordinates && Array.isArray(parsed.coordinates)) {
              // Filter coordinates to ensure they're valid [lat, lng] pairs
              routeCoords = parsed.coordinates
                .filter((coord: any) => 
                  Array.isArray(coord) && 
                  coord.length === 2 && 
                  typeof coord[0] === 'number' && 
                  typeof coord[1] === 'number')
                .map((coord: number[]) => [coord[0], coord[1]] as [number, number]);
                
              console.log(`Extracted ${routeCoords.length} valid coordinates for route ${route.id}`);
            }
          } catch (err) {
            console.warn(`Failed to parse GPX data for route ${route.id}:`, err);
          }
        }
        
        // Only add routes with valid coordinates
        if (routeCoords.length >= 2) {
          newCoordinates[route.id] = routeCoords;
        } else {
          console.log(`Route ${route.id} has insufficient coordinates (${routeCoords.length})`);
        }
      });
      
      setRouteCoordinates(newCoordinates);
    };
    
    extractCoordinates();
  }, [routes]);

  return (
    <div className="space-y-6">
      {/* Featured Route Map */}
      {mostRecentRoute && routeCoordinates[mostRecentRoute.id]?.length >= 2 && (
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
                center={routeCoordinates[mostRecentRoute.id][0]}
                zoom={12}
                height="100%"
                className="rounded-none"
                showControls={true}
                routeCoordinates={routeCoordinates[mostRecentRoute.id]}
                mapStyle="default"
                routeStyle={{
                  color: "#0EA5E9", // Ocean blue
                  weight: 4,
                  opacity: 0.8
                }}
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
            
            // Only render routes with valid GPS data
            const hasValidCoordinates = routeCoordinates[route.id]?.length >= 2;
            
            return (
              <Card key={route.id} className="overflow-hidden">
                <div className="h-2 bg-primary" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{route.name}</CardTitle>
                  <CardDescription>{route.date}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {hasValidCoordinates ? (
                    <div className="h-[100px] w-full mb-2">
                      <RouteMap
                        center={routeCoordinates[route.id][0]}
                        zoom={11}
                        height="100%"
                        className="rounded-md border border-border/50"
                        showControls={false}
                        routeCoordinates={routeCoordinates[route.id]}
                        mapStyle="default"
                        routeStyle={{
                          color: "#8B5CF6", // Vivid purple
                          weight: 3,
                          opacity: 0.8
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-[100px] w-full mb-2 flex items-center justify-center bg-muted rounded-md border border-border/50">
                      <p className="text-sm text-muted-foreground">No route data available</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <Map className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{route.distance.toFixed(1)} km</span>
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
                      <span className="text-sm">{route.calories || 0} kcal</span>
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
