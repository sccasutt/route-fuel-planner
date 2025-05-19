import { supabase } from "@/integrations/supabase/client";
import { fetchWindData, storeWindData } from "./weatherUtils";
import { updateRouteEnergyData } from "./energyCalculations";

/**
 * Process a route by fetching wind data and calculating energy information
 */
export async function processRouteWithWindAndEnergy(routeId: string): Promise<boolean> {
  try {
    // First, fetch the route data
    const { data: routeData, error } = await supabase
      .from('routes')
      .select('*')
      .eq('id', routeId)
      .single();
      
    if (error || !routeData) {
      console.error("Error fetching route:", error);
      return false;
    }
    
    // Check if we have starting location and date
    if (!routeData.start_lat || !routeData.start_lng || !routeData.date) {
      console.warn("Route missing required data for wind fetch:", routeData.id);
      return false;
    }
    
    // Check if weather_json exists and has the correct structure
    const hasExistingWindData = routeData.weather_json && 
      typeof routeData.weather_json === 'object' && 
      'wind_data' in routeData.weather_json && 
      Array.isArray(routeData.weather_json.wind_data);
    
    // Fetch wind data if not already present
    if (!hasExistingWindData) {
      console.log("Fetching wind data for route:", routeData.id);
      const windData = await fetchWindData(
        routeData.start_lat, 
        routeData.start_lng, 
        routeData.date
      );
      
      if (windData && windData.length > 0) {
        await storeWindData(routeId, windData);
        console.log(`Stored ${windData.length} wind data points for route: ${routeId}`);
      }
    }
    
    // Calculate and update energy and macronutrient data
    const success = await updateRouteEnergyData(routeId);
    
    return success;
  } catch (error) {
    console.error("Error processing route:", error);
    return false;
  }
}

/**
 * Process multiple routes in batch
 */
export async function processRouteBatch(routeIds: string[]): Promise<{ 
  success: number; 
  failed: number; 
}> {
  if (!routeIds || routeIds.length === 0) {
    return { success: 0, failed: 0 };
  }
  
  let success = 0;
  let failed = 0;
  
  // Process each route in sequence
  for (const routeId of routeIds) {
    try {
      // Update energy data
      const energyResult = await updateRouteEnergyData(routeId);
      if (energyResult) {
        success++;
      } else {
        failed++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error(`Error processing route ${routeId}:`, err);
      failed++;
    }
  }
  
  return { success, failed };
}

/**
 * Extract route points from existing route data and store them in the route_points table
 */
export async function extractAndStoreRoutePoints(routeId: string): Promise<boolean> {
  try {
    // Fetch route data
    const { data: routeData, error: routeError } = await supabase
      .from('routes')
      .select('*')
      .eq('id', routeId)
      .single();
      
    if (routeError || !routeData) {
      console.error("Error fetching route for points extraction:", routeError);
      return false;
    }
    
    // Extract coordinates
    let coordinates = null;
    
    // Try to get coordinates from the coordinates field
    if (routeData.coordinates) {
      try {
        coordinates = typeof routeData.coordinates === 'string' 
          ? JSON.parse(routeData.coordinates) 
          : routeData.coordinates;
      } catch (e) {
        console.error("Error parsing coordinates:", e);
      }
    }
    
    // If no coordinates, try to extract from gpx_data
    if (!coordinates && routeData.gpx_data) {
      try {
        const gpxData = typeof routeData.gpx_data === 'string'
          ? JSON.parse(routeData.gpx_data)
          : routeData.gpx_data;
        
        if (gpxData.coordinates) {
          coordinates = gpxData.coordinates;
        }
      } catch (e) {
        console.error("Error parsing gpx_data:", e);
      }
    }
    
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      console.log("No valid coordinates found for route:", routeId);
      return false;
    }
    
    // Delete existing points first to avoid duplicates
    await supabase
      .from('route_points')
      .delete()
      .eq('route_id', routeId);
    
    // Process in batches to avoid size limits
    const batchSize = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < coordinates.length; i += batchSize) {
      const batch = coordinates.slice(i, i + batchSize);
      
      // Transform to route_points format
      const points = batch.map((coord: any, index: number) => {
        let lat, lng, elevation = null;
        
        if (Array.isArray(coord)) {
          lat = coord[0];
          lng = coord[1];
          elevation = coord.length > 2 ? coord[2] : null;
        } else if (typeof coord === 'object') {
          lat = coord.lat !== undefined ? coord.lat : coord.latitude;
          lng = coord.lng !== undefined ? coord.lng : coord.longitude;
          elevation = coord.elevation || coord.ele || null;
        }
        
        return {
          route_id: routeId,
          sequence_index: i + index,
          lat,
          lng,
          elevation
        };
      }).filter(point => 
        point.lat !== undefined && point.lng !== undefined
      );
      
      if (points.length === 0) continue;
      
      const { error } = await supabase
        .from('route_points')
        .insert(points);
        
      if (error) {
        console.error("Error inserting route points:", error);
      } else {
        totalInserted += points.length;
      }
    }
    
    console.log(`Successfully inserted ${totalInserted} route points for route ${routeId}`);
    return totalInserted > 0;
  } catch (error) {
    console.error("Error in extractAndStoreRoutePoints:", error);
    return false;
  }
}
