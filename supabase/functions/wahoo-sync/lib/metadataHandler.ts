
import { parseNumericValue } from "./wahooUtils.ts";

/**
 * Extract metadata from activity
 */
export function processMetadata(activity: any): any {
  // Extract start coordinates if available
  const startLat = parseNumericValue(activity.start_lat);
  const startLng = parseNumericValue(activity.start_lng);
  const hasGpxFile = !!activity.gpx_file_url || !!activity.file?.url;
  
  return {
    ...(activity.additional_data || {}),
    start_lat: startLat,
    start_lng: startLng,
    has_file: hasGpxFile,
    file_type: activity.file_type || "unknown"
  };
}

/**
 * Extract initial energy and macronutrient values
 * Will be refined by worker job later
 */
export function processEnergyData(activity: any): {
  calories: number;
  caloriesPowerBased: number | null;
  caloriesEstimated: number | null;
  fatGrams: number | null;
  carbGrams: number | null;
  proteinGrams: number | null;
} {
  // Extract power data if available for energy calculations
  const avgPower = parseNumericValue(activity.average_power) || parseNumericValue(activity.avg_power);
  const durationSeconds = parseNumericValue(activity.duration_seconds);
  
  // Extract or calculate calories if available
  const calories = parseNumericValue(activity.calories) || parseNumericValue(activity.kcal) || 0;
  
  // Calculate power-based calories if possible
  const caloriesPowerBased = avgPower && durationSeconds ? 
    (avgPower * durationSeconds * 0.24) / 3600 : null;
  
  // Store estimated calories (non-power based) if no power data
  const caloriesEstimated = !avgPower ? calories : null;
  
  // Initial macronutrient calculations (will be refined by worker job)
  const totalCalories = caloriesPowerBased || calories || 0;
  const fatGrams = totalCalories ? (totalCalories * 0.3) / 9 : null;
  const carbGrams = totalCalories ? (totalCalories * 0.65) / 4 : null;
  const proteinGrams = totalCalories ? (totalCalories * 0.05) / 4 : null;
  
  return {
    calories,
    caloriesPowerBased,
    caloriesEstimated,
    fatGrams,
    carbGrams,
    proteinGrams
  };
}
