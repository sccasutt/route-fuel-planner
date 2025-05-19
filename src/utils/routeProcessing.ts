
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
    
    // Fetch wind data if not already present
    if (!routeData.weather_json || 
        !routeData.weather_json.wind_data || 
        (typeof routeData.weather_json === 'object' && !routeData.weather_json.wind_data)) {
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
  let success = 0;
  let failed = 0;
  
  for (const routeId of routeIds) {
    try {
      const result = await processRouteWithWindAndEnergy(routeId);
      if (result) {
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Error processing route ${routeId}:`, error);
      failed++;
    }
  }
  
  return { success, failed };
}
