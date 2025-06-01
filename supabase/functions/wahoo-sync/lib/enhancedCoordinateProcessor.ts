// Enhanced coordinate processing with FIT file handling and calorie calculations
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { downloadFitFile } from "./wahooDetailedApi.ts";

/**
 * Process detailed trackpoint data and store with enhanced metadata
 */
export async function processEnhancedTrackpoints(
  client: SupabaseClient,
  routeId: string,
  activity: any
): Promise<{ trackpointCount: number; coordinateCount: number; caloriesCalculated: boolean }> {
  console.log(`Processing enhanced trackpoints for route ${routeId}`);
  
  let trackpointCount = 0;
  let coordinateCount = 0;
  let caloriesCalculated = false;
  
  // STEP 1: Process detailed trackpoints if available
  if (activity.trackpoints && Array.isArray(activity.trackpoints) && activity.trackpoints.length > 0) {
    console.log(`Found ${activity.trackpoints.length} detailed trackpoints`);
    
    const result = await storeTrackpoints(client, routeId, activity.trackpoints);
    trackpointCount = result.trackpointCount;
    coordinateCount = result.coordinateCount;
    
    if (result.powerData) {
      caloriesCalculated = await calculateAndStoreCalories(client, routeId, result.powerData, activity);
    }
  }
  
  // STEP 2: Process FIT file if available and no trackpoints were found
  if (trackpointCount === 0 && activity.fit_file_url) {
    console.log(`Processing FIT file for route ${routeId}: ${activity.fit_file_url}`);
    
    try {
      // Get access token for file download (assuming it's available in the activity context)
      const accessToken = activity._access_token || Deno.env.get("WAHOO_ACCESS_TOKEN");
      
      if (!accessToken) {
        console.error("No access token available for FIT file download");
        return { trackpointCount: 0, coordinateCount: 0, caloriesCalculated: false };
      }
      
      const fitResult = await processFitFile(client, routeId, activity.fit_file_url, accessToken);
      trackpointCount = fitResult.trackpointCount;
      coordinateCount = fitResult.coordinateCount;
      caloriesCalculated = fitResult.caloriesCalculated;
      
    } catch (fitError) {
      console.error(`Error processing FIT file for route ${routeId}:`, fitError);
    }
  }
  
  // STEP 3: Fallback to any coordinate data in the activity
  if (trackpointCount === 0 && coordinateCount === 0) {
    const fallbackCoordinates = extractFallbackCoordinates(activity);
    if (fallbackCoordinates.length > 0) {
      coordinateCount = await storeFallbackCoordinates(client, routeId, fallbackCoordinates);
    }
  }
  
  return { trackpointCount, coordinateCount, caloriesCalculated };
}

/**
 * Store trackpoints in the database
 */
async function storeTrackpoints(client: SupabaseClient, routeId: string, trackpoints: any[]): Promise<{
  trackpointCount: number;
  coordinateCount: number;
  powerData: any[] | null;
}> {
  // Validate and clean trackpoints
  const validTrackpoints = trackpoints
    .filter((tp: any) => {
      const hasLat = tp.lat !== undefined && tp.lat !== null && !isNaN(Number(tp.lat));
      const hasLon = (tp.lon !== undefined && tp.lon !== null && !isNaN(Number(tp.lon))) || 
                     (tp.lng !== undefined && tp.lng !== null && !isNaN(Number(tp.lng)));
      return hasLat && hasLon;
    })
    .map((tp: any, index: number) => ({
      route_id: routeId,
      time: tp.time || tp.timestamp || null,
      lat: Number(tp.lat),
      lon: Number(tp.lon || tp.lng),
      elevation: tp.elevation !== undefined ? Number(tp.elevation) : 
                 tp.ele !== undefined ? Number(tp.ele) : 
                 tp.alt !== undefined ? Number(tp.alt) : null,
      power: tp.power !== undefined ? Number(tp.power) : 
             tp.watts !== undefined ? Number(tp.watts) : null,
      heart_rate: tp.heart_rate !== undefined ? Number(tp.heart_rate) : 
                  tp.hr !== undefined ? Number(tp.hr) : null,
      cadence: tp.cadence !== undefined ? Number(tp.cadence) : null
    }));
  
  if (validTrackpoints.length === 0) {
    return { trackpointCount: 0, coordinateCount: 0, powerData: null };
  }
  
  // Store trackpoints in batches
  const batchSize = 50;
  let trackpointCount = 0;
  
  for (let i = 0; i < validTrackpoints.length; i += batchSize) {
    const batch = validTrackpoints.slice(i, i + batchSize);
    
    const { error } = await client
      .from("trackpoints")
      .insert(batch);
    
    if (error) {
      console.error(`Error inserting trackpoints batch ${i/batchSize + 1}:`, error);
    } else {
      trackpointCount += batch.length;
      console.log(`Inserted trackpoints batch ${i/batchSize + 1}: ${batch.length} points`);
    }
  }
  
  // Extract coordinates for the coordinates field
  const coordinates = validTrackpoints.map(tp => [tp.lat, tp.lon]);
  
  // Update route with coordinates
  const { error: routeUpdateError } = await client
    .from('routes')
    .update({
      coordinates: coordinates,
      updated_at: new Date().toISOString()
    })
    .eq('id', routeId);
  
  if (routeUpdateError) {
    console.error("Error updating route coordinates:", routeUpdateError);
  } else {
    console.log(`Updated route ${routeId} with ${coordinates.length} coordinates`);
  }
  
  // Extract power data for calorie calculations
  const powerData = validTrackpoints.filter(tp => tp.power && tp.power > 0);
  
  return {
    trackpointCount,
    coordinateCount: coordinates.length,
    powerData: powerData.length > 0 ? powerData : null
  };
}

/**
 * Process FIT file and extract trackpoints
 */
async function processFitFile(
  client: SupabaseClient, 
  routeId: string, 
  fitFileUrl: string, 
  accessToken: string
): Promise<{ trackpointCount: number; coordinateCount: number; caloriesCalculated: boolean }> {
  
  try {
    // Download the FIT file
    const fitBuffer = await downloadFitFile(fitFileUrl, accessToken);
    
    if (!fitBuffer) {
      console.error("Failed to download FIT file");
      return { trackpointCount: 0, coordinateCount: 0, caloriesCalculated: false };
    }
    
    // Call GPX parser function to handle FIT file
    const { error: parserError, data: parserResult } = await client.functions.invoke('gpx-parser', {
      body: {
        route_id: routeId,
        gpx_file_url: fitFileUrl,
        file_type: 'fit'
      }
    });
    
    if (parserError) {
      console.error("Error calling GPX parser for FIT file:", parserError);
      return { trackpointCount: 0, coordinateCount: 0, caloriesCalculated: false };
    }
    
    console.log("FIT file processed successfully:", parserResult);
    
    // The GPX parser should have stored the coordinates and trackpoints
    return {
      trackpointCount: parserResult?.trackpoints_count || 0,
      coordinateCount: parserResult?.coordinates_count || 0,
      caloriesCalculated: false // Will be calculated separately if power data exists
    };
    
  } catch (error) {
    console.error("Error processing FIT file:", error);
    return { trackpointCount: 0, coordinateCount: 0, caloriesCalculated: false };
  }
}

/**
 * Calculate calories from power data and store enhanced energy data
 */
async function calculateAndStoreCalories(
  client: SupabaseClient,
  routeId: string,
  powerTrackpoints: any[],
  activity: any
): Promise<boolean> {
  try {
    // Calculate average power
    const totalPower = powerTrackpoints.reduce((sum, tp) => sum + tp.power, 0);
    const avgPower = totalPower / powerTrackpoints.length;
    
    // Get duration in seconds
    const durationSeconds = activity.duration_seconds || 3600; // fallback to 1 hour
    
    // Calculate power-based calories using cycling formula
    // Formula: (avg_power * duration_seconds * 0.24) / 3600
    const caloriesPowerBased = Math.round((avgPower * durationSeconds * 0.24) / 3600);
    
    // Calculate macronutrients (cycling typical breakdown)
    const fatGrams = Math.round(caloriesPowerBased * 0.3 / 9); // 30% fat, 9 cal/g
    const carbGrams = Math.round(caloriesPowerBased * 0.65 / 4); // 65% carbs, 4 cal/g
    const proteinGrams = Math.round(caloriesPowerBased * 0.05 / 4); // 5% protein, 4 cal/g
    
    // Update route with calculated energy data
    const { error: updateError } = await client
      .from('routes')
      .update({
        calories_power_based: caloriesPowerBased,
        calories: caloriesPowerBased, // Update main calories field
        fat_grams: fatGrams,
        carb_grams: carbGrams,
        protein_grams: proteinGrams,
        average_power: avgPower,
        updated_at: new Date().toISOString()
      })
      .eq('id', routeId);
    
    if (updateError) {
      console.error("Error updating route energy data:", updateError);
      return false;
    }
    
    console.log(`Calculated and stored energy data for route ${routeId}:`);
    console.log(`- Power-based calories: ${caloriesPowerBased}`);
    console.log(`- Average power: ${avgPower}W`);
    console.log(`- Macros: ${fatGrams}g fat, ${carbGrams}g carbs, ${proteinGrams}g protein`);
    
    return true;
  } catch (error) {
    console.error("Error calculating calories:", error);
    return false;
  }
}

/**
 * Extract coordinates from activity data as fallback
 */
function extractFallbackCoordinates(activity: any): [number, number][] {
  const sources = [
    activity.coordinates,
    activity.route_points,
    activity.path,
    activity.latlng,
    activity.waypoints
  ];
  
  for (const source of sources) {
    if (Array.isArray(source) && source.length > 0) {
      const coords = source
        .filter((item: any) => {
          if (Array.isArray(item) && item.length >= 2) {
            return !isNaN(Number(item[0])) && !isNaN(Number(item[1]));
          }
          if (item.lat !== undefined && (item.lon !== undefined || item.lng !== undefined)) {
            return !isNaN(Number(item.lat)) && !isNaN(Number(item.lon || item.lng));
          }
          return false;
        })
        .map((item: any) => {
          if (Array.isArray(item)) {
            return [Number(item[0]), Number(item[1])] as [number, number];
          }
          return [Number(item.lat), Number(item.lon || item.lng)] as [number, number];
        })
        .filter((coord: [number, number]) => 
          coord[0] >= -90 && coord[0] <= 90 && 
          coord[1] >= -180 && coord[1] <= 180
        );
      
      if (coords.length > 0) {
        console.log(`Found ${coords.length} fallback coordinates`);
        return coords;
      }
    }
  }
  
  return [];
}

/**
 * Store fallback coordinates
 */
async function storeFallbackCoordinates(
  client: SupabaseClient,
  routeId: string,
  coordinates: [number, number][]
): Promise<number> {
  try {
    // Update route with coordinates
    const { error: routeError } = await client
      .from('routes')
      .update({
        coordinates: coordinates,
        updated_at: new Date().toISOString()
      })
      .eq('id', routeId);
    
    if (routeError) {
      console.error("Error updating route with fallback coordinates:", routeError);
      return 0;
    }
    
    console.log(`Stored ${coordinates.length} fallback coordinates for route ${routeId}`);
    return coordinates.length;
  } catch (error) {
    console.error("Error storing fallback coordinates:", error);
    return 0;
  }
}
