
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
    // Generate route coordinates for each route
    // In a real implementation, these would come from the gpx_data or another source
    const generateCoordinates = () => {
      const newCoordinates: Record<string, [number, number][]> = {};
      
      routes.forEach(route => {
        let routeCoords: [number, number][] = [];
        
        // Try to parse GPX data if available
        if (route.gpx_data) {
          try {
            const parsed = JSON.parse(route.gpx_data);
            if (parsed.coordinates && Array.isArray(parsed.coordinates)) {
              routeCoords = parsed.coordinates;
            }
          } catch (err) {
            console.warn(`Failed to parse GPX data for route ${route.id}:`, err);
          }
        }
        
        // If no valid coordinates were found, generate a simple route
        if (routeCoords.length < 2) {
          // Generate a unique but consistent route for each id
          const idSum = route.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
          const centerLat = 51.505 + (idSum % 10) * 0.01;
          const centerLng = -0.09 + (idSum % 7) * 0.01;
          routeCoords = generateSimpleRouteAround([centerLat, centerLng], 0.02);
        }
        
        newCoordinates[route.id] = routeCoords;
      });
      
      setRouteCoordinates(newCoordinates);
    };
    
    generateCoordinates();
  }, [routes]);

  // Generate a simple circular route around a center point
  const generateSimpleRouteAround = (center: [number, number], radius: number): [number, number][] => {
    const points: [number, number][] = [];
    const steps = 12;
    
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const lat = center[0] + Math.sin(angle) * radius;
      const lng = center[1] + Math.cos(angle) * radius;
      points.push([lat, lng]);
    }
    
    return points;
  };

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
                center={routeCoordinates[mostRecentRoute.id]?.[0] || [51.505, -0.09]}
                zoom={12}
                height="100%"
                className="rounded-none"
                showControls={true}
                routeCoordinates={routeCoordinates[mostRecentRoute.id] || []}
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
            
            return (
              <Card key={route.id} className="overflow-hidden">
                <div className="h-2 bg-primary" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{route.name}</CardTitle>
                  <CardDescription>{route.date}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-[100px] w-full mb-2">
                    <RouteMap
                      center={routeCoordinates[route.id]?.[0] || [51.505, -0.09]}
                      zoom={11}
                      height="100%"
                      className="rounded-md border border-border/50"
                      showControls={false}
                      routeCoordinates={routeCoordinates[route.id] || []}
                      mapStyle="default"
                      routeStyle={{
                        color: "#8B5CF6", // Vivid purple
                        weight: 3,
                        opacity: 0.8
                      }}
                    />
                  </div>
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
