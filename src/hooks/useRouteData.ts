
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RouteData {
  id: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  duration_seconds: number;
  calories: number;
  gpx_data?: any;
  [key: string]: any;
}

export function useRouteData(routeId: string | undefined) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [hasRouteData, setHasRouteData] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]); // Default fallback

  useEffect(() => {
    const fetchRouteData = async () => {
      if (!routeId) return;
      
      try {
        setLoading(true);
        
        // Fetch the route data from the database
        const { data, error } = await supabase
          .from('routes')
          .select('*')
          .eq('id', routeId as any)
          .single();

        if (error) {
          console.error("Error fetching route:", error);
          toast({ 
            title: "Error", 
            description: "Failed to load route data", 
            variant: "destructive" 
          });
          navigate('/dashboard');
          return;
        }

        if (!data) {
          toast({ 
            title: "Not Found", 
            description: "Route not found", 
            variant: "destructive" 
          });
          navigate('/dashboard');
          return;
        }

        console.log("Fetched route data:", data);
        // Only set route data if we have a valid route object
        setRouteData(data as RouteData);
        
        // Parse GPS coordinates from gpx_data
        let coordinates: [number, number][] = [];
        let hasValidData = false;
        
        if (data && data.gpx_data) {
          try {
            // Try to parse the gpx_data field
            let parsedData;
            try {
              // Handle both string and object formats
              parsedData = typeof data.gpx_data === 'string' 
                ? JSON.parse(data.gpx_data) 
                : data.gpx_data;
              
              console.log("Successfully parsed GPX data:", typeof parsedData);
            } catch (parseErr) {
              console.error("GPX data is not valid JSON:", parseErr);
              console.log("Raw GPX data type:", typeof data.gpx_data);
              console.log("Raw GPX data sample:", 
                typeof data.gpx_data === 'string' 
                  ? data.gpx_data.substring(0, 100) + '...' 
                  : data.gpx_data
              );
            }
            
            // If we successfully parsed JSON data
            if (parsedData) {
              // First try new format where coordinates are directly in the top level
              if (parsedData.coordinates && Array.isArray(parsedData.coordinates)) {
                // Ensure each coordinate is a valid [lat, lng] tuple
                coordinates = parsedData.coordinates
                  .filter((coord: any) => 
                    Array.isArray(coord) && 
                    coord.length === 2 &&
                    typeof coord[0] === 'number' && 
                    typeof coord[1] === 'number')
                  .map((coord: number[]) => [coord[0], coord[1]] as [number, number]);
                
                hasValidData = coordinates.length >= 2;
                console.log(`Extracted ${coordinates.length} valid coordinates from JSON gpx_data`);
              }
              // If no coordinates found in top level, check if they're in a raw_gpx field
              else if (parsedData.raw_gpx) {
                try {
                  const rawGpx = typeof parsedData.raw_gpx === 'string'
                    ? JSON.parse(parsedData.raw_gpx)
                    : parsedData.raw_gpx;
                    
                  if (rawGpx && rawGpx.coordinates && Array.isArray(rawGpx.coordinates)) {
                    coordinates = rawGpx.coordinates
                      .filter((coord: any) => 
                        Array.isArray(coord) && 
                        coord.length === 2 &&
                        typeof coord[0] === 'number' && 
                        typeof coord[1] === 'number')
                      .map((coord: number[]) => [coord[0], coord[1]] as [number, number]);
                    
                    hasValidData = coordinates.length >= 2;
                    console.log(`Extracted ${coordinates.length} valid coordinates from raw_gpx field`);
                  }
                } catch (err) {
                  console.error("Failed to parse raw_gpx data:", err);
                }
              }
            }
          } catch (err) {
            console.error("Failed to process GPX data:", err);
          }
        }
        
        if (!hasValidData) {
          console.log("No valid route coordinates found, using fallback mock data");
          // Fallback to mock data if no valid coordinates
          coordinates = [
            [51.505, -0.09],
            [51.51, -0.1],
            [51.52, -0.12],
            [51.518, -0.14],
            [51.51, -0.15],
            [51.5, -0.14],
            [51.495, -0.12],
            [51.505, -0.09],
          ];
        }
        
        setRouteCoordinates(coordinates);
        setHasRouteData(hasValidData);
        
        // Set map center based on first coordinate
        if (coordinates.length > 0) {
          setMapCenter([coordinates[0][0], coordinates[0][1]]);
        }
      } catch (err) {
        console.error("Error in route data fetch:", err);
        toast({ 
          title: "Error", 
          description: "An unexpected error occurred", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRouteData();
  }, [routeId, navigate, toast]);

  return { 
    loading, 
    routeData, 
    routeCoordinates, 
    hasRouteData, 
    mapCenter 
  };
}
