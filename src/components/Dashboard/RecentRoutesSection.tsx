
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
  coordinates?: [number, number][];
  type?: string;
}

interface Props {
  routes: RouteType[];
}

export function RecentRoutesSection({ routes }: Props) {
  // Get the most recent route for the featured map
  const mostRecentRoute = routes.length > 0 ? routes[0] : null;
  const [routeCoordinates, setRouteCoordinates] = useState<Record<string, [number, number][]>>({});

  useEffect(() => {
    console.log("RecentRoutesSection: Processing", routes.length, "routes");
    
    // Extract real GPS coordinates from the routes' gpx_data
    const extractCoordinates = () => {
      const newCoordinates: Record<string, [number, number][]> = {};
      
      routes.forEach(route => {
        // First check for preloaded coordinates
        if (route.coordinates && Array.isArray(route.coordinates) && route.coordinates.length >= 2) {
          console.log(`Using ${route.coordinates.length} preloaded coordinates for route ${route.id}`);
          newCoordinates[route.id] = route.coordinates as [number, number][];
          return;
        }
        
        let routeCoords: [number, number][] = [];
        
        // Try to parse GPX data if available
        if (route.gpx_data) {
          try {
            // Handle both string and object formats
            const parsed = typeof route.gpx_data === 'string' 
              ? JSON.parse(route.gpx_data) 
              : route.gpx_data;
              
            if (parsed) {
              // First check for coordinates in the standard format
              if (parsed.coordinates && Array.isArray(parsed.coordinates)) {
                routeCoords = parsed.coordinates
                  .filter((coord: any) => 
                    Array.isArray(coord) && 
                    coord.length === 2 && 
                    typeof coord[0] === 'number' && 
                    typeof coord[1] === 'number')
                  .map((coord: number[]) => [coord[0], coord[1]] as [number, number]);
                  
                console.log(`Extracted ${routeCoords.length} valid coordinates for route ${route.id}`);
              } 
              // If no coordinates found, check if the raw GPX might have them
              else if (parsed.raw_gpx) {
                try {
                  const rawParsed = typeof parsed.raw_gpx === 'string'
                    ? JSON.parse(parsed.raw_gpx)
                    : parsed.raw_gpx;
                    
                  if (rawParsed && rawParsed.coordinates && Array.isArray(rawParsed.coordinates)) {
                    routeCoords = rawParsed.coordinates
                      .filter((coord: any) => 
                        Array.isArray(coord) && 
                        coord.length === 2 && 
                        typeof coord[0] === 'number' && 
                        typeof coord[1] === 'number')
                      .map((coord: number[]) => [coord[0], coord[1]] as [number, number]);
                      
                    console.log(`Extracted ${routeCoords.length} valid coordinates from raw GPX for route ${route.id}`);
                  }
                } catch (err) {
                  console.warn(`Failed to parse raw GPX data for route ${route.id}:`, err);
                }
              } else {
                console.log(`Route ${route.id} has gpx_data but no valid coordinates array`, parsed);
              }
            }
          } catch (err) {
            console.warn(`Failed to parse GPX data for route ${route.id}:`, err);
          }
        }
        
        // Only add routes with valid coordinates
        if (routeCoords.length >= 2) {
          newCoordinates[route.id] = routeCoords;
        } else {
          // Add fallback mock coordinates for visualization 
          const mockCoordinates: [number, number][] = [
            [51.505, -0.09],
            [51.51, -0.1],
            [51.52, -0.12],
            [51.518, -0.14],
            [51.51, -0.15],
            [51.5, -0.14],
            [51.495, -0.12],
            [51.505, -0.09],
          ];
          
          console.log(`Using mock coordinates for route ${route.id}`);
          newCoordinates[route.id] = mockCoordinates;
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
      {mostRecentRoute && (
        <FeaturedRouteMap 
          route={mostRecentRoute} 
          routeCoordinates={routeCoordinates[mostRecentRoute.id] || []}
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
