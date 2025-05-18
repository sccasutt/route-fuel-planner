import { extractNestedValue, formatDurationString, durationToSeconds, parseNumericValue } from "./wahooUtils.ts";

/**
 * Extracts and normalizes fields from activity data
 */
export function extractActivityFields(activity: any) {
  // Extract ID with fallbacks based on Wahoo API doc field mappings
  const id = extractNestedValue(activity, [
    'id', 
    'workout_id', 
    'route_id',
    'workout_history_id',
    'ride_id'
  ]) || `wahoo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Extract name with fallbacks
  const name = extractNestedValue(activity, [
    'name', 
    'title', 
    'workout_name',
    'route_name',
    'ride_name',
    'workout_title'
  ]) || "Unnamed Activity";
  
  // Extract date with fallbacks
  const dateValue = extractNestedValue(activity, [
    'start_time', 
    'starts', 
    'created_at', 
    'timestamp',
    'date',
    'workout_date',
    'ride_date',
    'completed_on',
    'workout_summary.created_at'
  ]) || new Date().toISOString();
  
  // Extract distance with fallbacks (in kilometers)
  let distance = extractNestedValue(activity, [
    'distance', 
    'workout_summary.distance_accum',
    'summary.distance',
    'total_distance',
    'distance_km',
    'route_distance',
    'kilometers'
  ]);
  
  // Extract elevation with fallbacks
  let elevation = extractNestedValue(activity, [
    'elevation', 
    'elevation_gain',
    'workout_summary.ascent_accum',
    'summary.elevation',
    'altitude_gain',
    'total_ascent',
    'ascent',
    'route_elevation',
    'climb',
    'climbing'
  ]);
  
  // Extract calories with fallbacks
  let calories = extractNestedValue(activity, [
    'calories', 
    'energy',
    'workout_summary.calories_accum',
    'summary.calories',
    'total_calories',
    'kcal',
    'calorie_estimate'
  ]);
  
  // Extract duration with improved fallbacks for various formats
  let durationValue = extractNestedValue(activity, [
    'duration',
    'workout_summary.duration_total_accum',
    'summary.duration',
    'duration_seconds',
    'elapsed_time',
    'moving_time',
    'minutes',
    'seconds',
    'total_time'
  ]);
  
  // Process duration to handle different formats and normalize to H:MM:SS format
  const durationResult = processDuration(durationValue);
  
  // Convert numeric values correctly
  if (typeof distance === 'string') distance = parseFloat(distance) || 0;
  if (typeof elevation === 'string') elevation = parseFloat(elevation) || 0;
  if (typeof calories === 'string') calories = parseInt(calories, 10) || 0;
  
  // Ensure all values are numbers, not null/undefined
  const normalizedDistance = parseNumericValue(distance);
  const normalizedElevation = parseNumericValue(elevation);
  const normalizedCalories = parseNumericValue(calories);
  
  // Convert distance to kilometers if needed (assuming meters)
  const finalDistance = normalizedDistance > 1000 && normalizedDistance < 1000000 
    ? normalizedDistance / 1000 
    : normalizedDistance;
  
  return {
    id,
    name,
    date: dateValue,
    distance: finalDistance,
    elevation: normalizedElevation,
    duration: durationResult.duration,
    duration_seconds: durationResult.durationSeconds,
    calories: normalizedCalories
  };
}

/**
 * Process duration to normalize it to H:MM:SS format
 */
function processDuration(durationValue: any): { duration: string, durationSeconds: number } {
  let duration;
  let durationSeconds;
  
  if (typeof durationValue === 'number') {
    // If duration is in seconds, convert to H:MM:SS
    durationSeconds = durationValue;
    // Format as H:MM:SS (no leading zero for hours)
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = Math.floor(durationSeconds % 60);
    duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else if (typeof durationValue === 'string') {
    // Check if it's already in H:MM:SS format
    const timeFormat = durationValue.match(/^(\d+):(\d+):(\d+)$/);
    if (timeFormat) {
      const hours = parseInt(timeFormat[1], 10);
      const minutes = parseInt(timeFormat[2], 10);
      const seconds = parseInt(timeFormat[3], 10);
      
      // Keep format as H:MM:SS (no leading zero for hours)
      duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      durationSeconds = hours * 3600 + minutes * 60 + seconds;
    } else {
      // For other formats, parse and normalize to H:MM:SS
      durationSeconds = durationToSeconds(durationValue);
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      const seconds = Math.floor(durationSeconds % 60);
      duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  } else {
    // Default case if no valid duration found
    duration = "0:01:00"; // Default 1 minute
    durationSeconds = 60;
  }
  
  return { duration, durationSeconds };
}
