
import { useState, useEffect } from "react";
import { formatHumanReadableDuration } from "@/lib/durationFormatter";
import { FeaturedRouteMap } from "./FeaturedRouteMap";
import { RoutesGrid } from "./RoutesGrid";

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

  // Process routes to have human readable durations
  const processedRoutes = routes.map(route => ({
    ...route,
    duration: formatHumanReadableDuration(route.duration_seconds || 0)
  }));

  return (
    <div className="space-y-6">
      {/* Featured Route Map */}
      {mostRecentRoute && routeCoordinates[mostRecentRoute.id]?.length >= 2 && (
        <FeaturedRouteMap 
          route={mostRecentRoute} 
          routeCoordinates={routeCoordinates[mostRecentRoute.id]}
        />
      )}

      {/* Routes List */}
      <RoutesGrid 
        routes={processedRoutes}
        routeCoordinates={routeCoordinates}
      />
    </div>
  );
}
