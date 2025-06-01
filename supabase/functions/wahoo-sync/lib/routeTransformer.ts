
import { formatDurationString, durationToSeconds, parseNumericValue } from "./wahooUtils.ts";
import { processCoordinates } from "./coordinateHandler.ts";
import { processMetadata, processEnergyData } from "./metadataHandler.ts";
import { extractCoordinates } from "./extractCoordinates.ts";

/**
 * Transform activity data to route schema with enhanced FIT file support
 */
export function transformActivityToRoute(activity: any, userId: string): any {
  // Get a proper ID (prefer wahoo_route_id if present)
  const id = activity.id?.toString() || activity.wahoo_id?.toString() || activity.route_id?.toString() || 
    `wahoo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Extract GPS data from activity
  const gpxData = activity.gpx_data || null;
  
  // Store FIT file URL if available (this is the key change)
  const fitFileUrl = activity.fit_file_url || activity.file?.url || activity.download_url || null;
  const gpxFileUrl = activity.gpx_file_url || fitFileUrl; // Use FIT file URL as GPX file URL for processing
  
  // Get coordinates - add more detailed logging
  console.log(`Processing coordinates for activity ID: ${id}`);
  let coordinates = null;
  
  // Use the enhanced coordinate extraction function
  const extractedCoordinates = extractCoordinates(activity);
  
  if (extractedCoordinates && extractedCoordinates.length > 0) {
    coordinates = extractedCoordinates;
    console.log(`Extracted ${coordinates.length} coordinates for activity ${id}`);
  } else {
    console.log(`No coordinates extracted for activity ${id}`);
    
    // If no coordinates but we have file URL, we'll process it later
    if (fitFileUrl) {
      console.log(`Activity ${id} has FIT file URL but no coordinates - will process file: ${fitFileUrl}`);
    }
  }
  
  // Calculate duration_seconds if it doesn't exist
  let durationSeconds = parseNumericValue(activity.duration_seconds);
  if (!durationSeconds && activity.duration) {
    durationSeconds = durationToSeconds(activity.duration);
  }
  
  // Process start coordinates
  const startLat = parseNumericValue(activity.start_lat);
  const startLng = parseNumericValue(activity.start_lng);
  
  // Process metadata
  const metadata = processMetadata(activity);
  
  // Process energy data
  const energyData = processEnergyData(activity);

  // Log what we're about to return
  console.log(`Transformed route ${id}:`);
  console.log(`- Has ${coordinates ? coordinates.length : 0} coordinates`);
  console.log(`- Has FIT file URL: ${!!fitFileUrl}`);
  console.log(`- Needs FIT processing: ${!!fitFileUrl && !coordinates}`);
  console.log(`- Distance: ${parseNumericValue(activity.distance)}`);
  console.log(`- Duration: ${activity.duration || "0:01:00"}`);
  
  return {
    user_id: userId,
    wahoo_route_id: id,
    name: activity.name || "Unnamed Activity",
    date: new Date(activity.date).toISOString(),
    distance: parseNumericValue(activity.distance),
    elevation: parseNumericValue(activity.elevation),
    duration: activity.duration || "0:01:00",
    duration_seconds: durationSeconds || 60,
    calories: energyData.calories,
    // Add new fields for energy calculations
    calories_power_based: energyData.caloriesPowerBased,
    calories_estimated: energyData.caloriesEstimated,
    // Store initial macronutrient values
    fat_grams: energyData.fatGrams,
    carb_grams: energyData.carbGrams,
    protein_grams: energyData.proteinGrams,
    // Store average power if available
    average_power: parseNumericValue(activity.average_power) || parseNumericValue(activity.avg_power),
    gpx_data: gpxData,
    // Store coordinates directly in the JSONB field
    coordinates: coordinates,
    // Store additional metadata if available
    metadata: metadata ? JSON.stringify(metadata) : null,
    type: activity.type || "activity",
    // Store FIT file URL for processing
    gpx_file_url: gpxFileUrl,
    file_url: fitFileUrl,
    start_lat: startLat,
    start_lng: startLng,
    // Flag for FIT file processing
    needs_fit_processing: !!fitFileUrl && !coordinates
  };
}
