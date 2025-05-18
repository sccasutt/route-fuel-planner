
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
    
    // Extract GPS coordinates from different possible sources based on Wahoo API formats
    let gpxData = null;
    
    // First check for route points or coordinates
    if (activity.route_points || activity.coordinates || activity.latlng || activity.path || activity.points) {
      let coordinates: [number, number][] = [];
      
      if (Array.isArray(activity.route_points)) {
        coordinates = activity.route_points
          .filter((point: any) => point.lat && point.lng)
          .map((point: any) => [point.lat, point.lng] as [number, number]);
      } else if (Array.isArray(activity.coordinates)) {
        coordinates = activity.coordinates
          .filter((coord: any) => Array.isArray(coord) && coord.length === 2)
          .map((coord: any) => [coord[0], coord[1]] as [number, number]);
      } else if (Array.isArray(activity.latlng)) {
        coordinates = activity.latlng
          .filter((coord: any) => Array.isArray(coord) && coord.length === 2)
          .map((coord: any) => [coord[0], coord[1]] as [number, number]);
      } else if (Array.isArray(activity.path)) {
        coordinates = activity.path
          .filter((point: any) => point.lat && point.lng)
          .map((point: any) => [point.lat, point.lng] as [number, number]);
      } else if (Array.isArray(activity.points)) {
        coordinates = activity.points
          .filter((point: any) => (point.lat !== undefined && point.lng !== undefined) || 
                                 (point.latitude !== undefined && point.longitude !== undefined))
          .map((point: any) => {
            const lat = point.lat !== undefined ? point.lat : point.latitude;
            const lng = point.lng !== undefined ? point.lng : point.longitude;
            return [lat, lng] as [number, number];
          });
      }
      
      if (coordinates.length > 0) {
        gpxData = JSON.stringify({ coordinates });
        console.log(`Extracted ${coordinates.length} coordinates for activity ${id}`);
      }
    }
    
    // If no coordinates found yet, try track_points
    if (!gpxData && (activity.track_points || activity.track_data)) {
      const trackData = activity.track_points || activity.track_data;
      if (Array.isArray(trackData)) {
        try {
          const coordinates = trackData
            .filter((point: any) => {
              return (point.lat !== undefined && point.lon !== undefined) || 
                     (point.latitude !== undefined && point.longitude !== undefined);
            })
            .map((point: any) => {
              const lat = point.lat !== undefined ? point.lat : point.latitude;
              const lng = point.lon !== undefined ? point.lon : point.longitude;
              return [lat, lng] as [number, number];
            });
          
          if (coordinates.length > 0) {
            gpxData = JSON.stringify({ coordinates });
            console.log(`Extracted ${coordinates.length} coordinates from track_points for activity ${id}`);
          }
        } catch (err) {
          console.error(`Error processing track points for activity ${id}:`, err);
        }
      }
    }

    // If we have a gpx_file_url, include that in the metadata
    const gpxFileUrl = activity.gpx_file_url || activity.gpx_url;
    
    // Determine activity type based on source endpoint or type field
    const activityType = activity.type || 
                        activity.workout_type || 
                        activity.ride_type || 
                        activity.route_type || 
                        "activity";
    
    return {
      id,
      name,
      date: dateValue,
      distance,
      elevation,
      duration,
      duration_seconds: durationSeconds,
      calories,
      gpx_data: gpxData || activity.gpx_data || null,
      type: activityType,
      gpx_file_url: gpxFileUrl,
      additional_data: {
        wahoo_type: activityType,
        source_endpoint: activity._sourceEndpoint // This will be useful for debugging
      }
    };
  });
  
  console.log(`Successfully formatted ${formattedActivities.length} activities`);
  return formattedActivities;
}
