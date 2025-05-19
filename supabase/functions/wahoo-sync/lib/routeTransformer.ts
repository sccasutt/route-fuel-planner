
import { formatDurationString, durationToSeconds, parseNumericValue } from "./wahooUtils.ts";
import { processCoordinates } from "./coordinateHandler.ts";
import { processMetadata, processEnergyData } from "./metadataHandler.ts";

/**
 * Transform activity data to route schema
 */
export function transformActivityToRoute(activity: any, userId: string): any {
  // Get a proper ID (prefer wahoo_route_id if present)
  const id = activity.id?.toString() || activity.wahoo_id?.toString() || activity.route_id?.toString() || 
    `wahoo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Extract GPS data from activity
  const gpxData = activity.gpx_data || null;
  
  // Store file URL if available
  const gpxFileUrl = activity.gpx_file_url || activity.file?.url || null;
  
  // Get coordinates
  const coordinates = processCoordinates(activity);
  
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
    gpx_file_url: gpxFileUrl,
    start_lat: startLat,
    start_lng: startLng
  };
}
