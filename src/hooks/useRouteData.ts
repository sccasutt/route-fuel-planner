
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RouteType } from "@/types/route";

export interface RouteData extends RouteType {
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
        
        // Transform data to match RouteData interface with proper type casting
        const typedRouteData: RouteData = {
          id: data.id,
          name: data.name || "Unnamed Route",
          date: data.date || new Date().toISOString(),
          distance: data.distance || 0,
          elevation: data.elevation || 0,
          duration: data.duration || "0:00:00",
          duration_seconds: data.duration_seconds || 0,
          calories: data.calories || 0,
          gpx_data: data.gpx_data,
          gpx_file_url: data.gpx_file_url,
          type: data.type,
          // Safely handle coordinates from database, ensuring they're treated as [number, number][]
          coordinates: data.coordinates ? parseCoordinatesArray(data.coordinates) : [],
          // Include file object if it exists
          file: data.file,
          start_lat: data.start_lat,
          start_lng: data.start_lng,
          // Include any other fields from the original data
          ...data
        };
        
        setRouteData(typedRouteData);
        
        // Parse GPS coordinates from various sources
        let coordinates: [number, number][] = [];
        let hasValidData = false;
        
        // First try to get coordinates directly from the coordinates field
        if (typedRouteData.coordinates && Array.isArray(typedRouteData.coordinates)) {
          coordinates = parseCoordinatesArray(typedRouteData.coordinates);
          hasValidData = coordinates.length >= 2;
          console.log(`Found ${coordinates.length} coordinates directly in coordinates field`);
        }
        // If not available or insufficient, try to extract from gpx_data
        else if (data && data.gpx_data && (!hasValidData || coordinates.length < 2)) {
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
                coordinates = parseCoordinatesArray(parsedData.coordinates);
                
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
                    coordinates = parseCoordinatesArray(rawGpx.coordinates);
                    
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
        
        // If we still don't have valid data and we have a GPX file URL or a file URL from Wahoo, download and parse it
        const fileUrl = data.gpx_file_url || (typedRouteData.file?.url);
        if ((!hasValidData || coordinates.length < 2) && fileUrl) {
          try {
            console.log("Attempting to download and parse file from URL:", fileUrl);
            
            // Call our Edge Function to download and parse the file
            const { data: fileData, error: fileError } = await supabase.functions.invoke("gpx-parser", {
              body: { 
                gpx_url: data.gpx_file_url,
                file_url: typedRouteData.file?.url 
              }
            });
            
            if (fileError) {
              console.error("Error downloading file:", fileError);
            } else if (fileData && fileData.coordinates && Array.isArray(fileData.coordinates)) {
              coordinates = parseCoordinatesArray(fileData.coordinates);
              
              hasValidData = coordinates.length >= 2;
              console.log(`Extracted ${coordinates.length} coordinates from file URL`);
              
              // Store the parsed coordinates back to the database for future use
              if (hasValidData) {
                const { error: updateError } = await supabase
                  .from('routes')
                  .update({ coordinates: coordinates })
                  .eq('id', data.id);
                
                if (updateError) {
                  console.error("Error updating coordinates in database:", updateError);
                } else {
                  console.log("Successfully stored coordinates in database");
                }
              }
            }
          } catch (err) {
            console.error("Failed to download or parse file:", err);
          }
        }
        
        // If trying to get data from the "file" object in the Wahoo format
        if ((!hasValidData || coordinates.length < 2) && typedRouteData.start_lat && typedRouteData.start_lng) {
          // Use the start coordinates as a fallback
          coordinates = [
            [Number(typedRouteData.start_lat), Number(typedRouteData.start_lng)]
          ];
          console.log("Using start_lat/start_lng as fallback coordinates");
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

  // Helper function to safely parse coordinates array
  function parseCoordinatesArray(input: any): [number, number][] {
    try {
      if (!Array.isArray(input)) {
        return [];
      }
      
      return input
        .filter((coord: any) => 
          Array.isArray(coord) && 
          coord.length === 2 &&
          !isNaN(Number(coord[0])) && 
          !isNaN(Number(coord[1]))
        )
        .map((coord: any) => [Number(coord[0]), Number(coord[1])] as [number, number]);
    } catch (e) {
      console.error("Error parsing coordinates:", e);
      return [];
    }
  }

  return { 
    loading, 
    routeData, 
    routeCoordinates, 
    hasRouteData, 
    mapCenter 
  };
}
