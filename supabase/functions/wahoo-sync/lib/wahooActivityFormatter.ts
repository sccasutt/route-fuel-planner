
// Formatter for Wahoo activity data
import { extractNestedValue, formatDurationString, durationToSeconds, parseNumericValue } from "./wahooUtils.ts";

/**
 * Transforms raw activity data from various Wahoo API endpoints to consistent format
 */
export function formatWahooActivities(activities: any[]) {
  if (!activities || activities.length === 0) {
    console.log("No activities to format");
    return [];
  }
  
  console.log(`Formatting ${activities.length} activities`);
  
  // Transform activity data with robust fallback extraction
  const formattedActivities = activities.map(activity => {
    // Extract ID with fallbacks
    const id = extractNestedValue(activity, ['id', 'workout_id', 'route_id']) || 
              `wahoo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Extract name with fallbacks
    const name = extractNestedValue(activity, ['name', 'title', 'workout_name']) || "Unnamed Activity";
    
    // Extract date with fallbacks
    const dateValue = extractNestedValue(activity, [
      'start_time', 'starts', 'created_at', 'timestamp', 
      'workout_summary.created_at', 'date'
    ]) || new Date().toISOString();
    
    // Extract distance with fallbacks
    let distance = extractNestedValue(activity, [
      'distance', 
      'workout_summary.distance_accum',
      'summary.distance',
      'total_distance',
      'distance_km'
    ]);
    
    // Extract elevation with fallbacks
    let elevation = extractNestedValue(activity, [
      'elevation', 
      'elevation_gain',
      'workout_summary.ascent_accum',
      'summary.elevation',
      'altitude_gain',
      'total_ascent',
      'ascent'
    ]);
    
    // Extract calories with fallbacks
    let calories = extractNestedValue(activity, [
      'calories', 
      'energy',
      'workout_summary.calories_accum',
      'summary.calories',
      'total_calories',
      'kcal'
    ]);
    
    // Extract duration with improved fallbacks for various formats
    let durationValue = extractNestedValue(activity, [
      'duration',
      'workout_summary.duration_total_accum',
      'minutes',
      'summary.duration',
      'duration_seconds',
      'elapsed_time',
      'moving_time'
    ]);
    
    // Process duration to handle different formats
    let duration = formatDurationString(durationValue);
    let durationSeconds = durationToSeconds(durationValue);
    
    // Convert numeric values correctly
    if (typeof distance === 'string') distance = parseFloat(distance) || 0;
    if (typeof elevation === 'string') elevation = parseFloat(elevation) || 0;
    if (typeof calories === 'string') calories = parseInt(calories, 10) || 0;
    
    // Ensure all values are numbers, not null/undefined
    distance = parseNumericValue(distance);
    elevation = parseNumericValue(elevation);
    calories = parseNumericValue(calories);
    
    // Convert distance to kilometers if needed
    if (distance > 1000 && distance < 1000000) {
      distance = distance / 1000;
    }
    
    return {
      id,
      name,
      date: dateValue,
      distance,
      elevation,
      duration,
      duration_seconds: durationSeconds,
      calories,
      gpx_data: activity.gpx_data || null,
      type: activity.type || activity.workout_type || "activity"
    };
  });
  
  console.log(`Successfully formatted ${formattedActivities.length} activities`);
  return formattedActivities;
}
