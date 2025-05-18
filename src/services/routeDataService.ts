
import { supabase } from "@/integrations/supabase/client";
import { RouteData } from "@/types/routeData";
import { parseCoordinatesArray } from "@/utils/coordinateUtils";

/**
 * Fetch route data from the database
 * @param routeId The ID of the route to fetch
 * @returns The route data or null if not found
 */
export async function fetchRouteData(routeId: string): Promise<RouteData | null> {
  if (!routeId) return null;
  
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('id', routeId)
    .single();

  if (error || !data) {
    console.error("Error fetching route:", error);
    return null;
  }

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
    // Additional fields copied from original data
    ...data
  };

  return typedRouteData;
}

/**
 * Extract coordinates from various sources in the route data
 * @param routeData The route data object
 * @returns Array of [lat, lng] coordinates and a flag indicating if data is valid
 */
export async function extractRouteCoordinates(routeData: RouteData | null): Promise<{
  coordinates: [number, number][];
  hasValidData: boolean;
}> {
  let coordinates: [number, number][] = [];
  let hasValidData = false;
  
  if (!routeData) {
    return { coordinates, hasValidData };
  }
  
  // First try to get coordinates directly from the coordinates field
  if (routeData.coordinates) {
    coordinates = parseCoordinatesArray(routeData.coordinates);
    hasValidData = coordinates.length >= 2;
    console.log(`Found ${coordinates.length} coordinates directly in coordinates field`);
  }
  
  // If not available or insufficient, try to extract from gpx_data
  if (routeData && routeData.gpx_data && (!hasValidData || coordinates.length < 2)) {
    try {
      // Try to parse the gpx_data field
      let parsedData;
      try {
        // Handle both string and object formats
        parsedData = typeof routeData.gpx_data === 'string' 
          ? JSON.parse(routeData.gpx_data) 
          : routeData.gpx_data;
        
        console.log("Successfully parsed GPX data:", typeof parsedData);
      } catch (parseErr) {
        console.error("GPX data is not valid JSON:", parseErr);
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
  
  return { coordinates, hasValidData };
}

/**
 * Download and parse GPX data from file URL using the edge function
 * @param routeId The route ID
 * @param gpxFileUrl The URL to the GPX file
 * @param fileUrl Alternative URL format
 * @returns The parsed coordinates
 */
export async function fetchCoordinatesFromFileUrl(
  routeId: string,
  gpxFileUrl?: string | null,
  fileUrl?: string | null
): Promise<[number, number][]> {
  if (!gpxFileUrl && !fileUrl) {
    return [];
  }

  console.log("Attempting to download and parse file from URL:", gpxFileUrl || fileUrl);
  
  try {
    // Call our Edge Function to download and parse the file
    const { data: fileData, error: fileError } = await supabase.functions.invoke("gpx-parser", {
      body: { 
        gpx_url: gpxFileUrl,
        file_url: fileUrl 
      }
    });
    
    if (fileError) {
      console.error("Error downloading file:", fileError);
      return [];
    } 
    
    if (fileData && fileData.coordinates && Array.isArray(fileData.coordinates)) {
      const coordinates = parseCoordinatesArray(fileData.coordinates);
      
      if (coordinates.length >= 2) {
        console.log(`Extracted ${coordinates.length} coordinates from file URL`);
        
        // Store the parsed coordinates back to the database for future use
        const { error: updateError } = await supabase
          .from('routes')
          .update({ coordinates: coordinates })
          .eq('id', routeId);
        
        if (updateError) {
          console.error("Error updating coordinates in database:", updateError);
        } else {
          console.log("Successfully stored coordinates in database");
        }
        
        return coordinates;
      }
    }
  } catch (err) {
    console.error("Failed to download or parse file:", err);
  }
  
  return [];
}
