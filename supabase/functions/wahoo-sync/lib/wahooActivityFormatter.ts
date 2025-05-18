// Formatter for Wahoo activity data
import { extractCoordinates, createGpxDataObject } from "./extractCoordinates.ts";
import { extractActivityFields } from "./activityFieldExtractor.ts";

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
    // Extract base fields using the field extractor
    const basicFields = extractActivityFields(activity);
    
    // Extract GPS coordinates from different possible sources
    const coordinates = extractCoordinates(activity);
    
    // IMPORTANT: First preserve the original raw GPX data if available
    // This ensures we keep the complete data for later use
    const gpxRawData = activity.gpx_data || activity.route_gpx || activity.gpx || activity.gpx_string || null;
    
    // Create the GPX data object that will be stored in the database
    // This ensures we store both raw GPX data (if available) and extracted coordinates
    const gpxData = createGpxDataObject(coordinates, gpxRawData);
    
    // If we have coordinates, log success
    if (coordinates.length > 0) {
      console.log(`Created GPX data with ${coordinates.length} coordinates for activity ${basicFields.id}`);
    } else if (gpxRawData) {
      console.log(`Stored raw GPX data for activity ${basicFields.id} but no coordinates could be extracted`);
    }

    // If we have a gpx_file_url, include that 
    const gpxFileUrl = activity.gpx_file_url || activity.gpx_url || null;
    
    // Determine activity type based on source endpoint or type field
    const activityType = activity.type || 
                        activity.workout_type || 
                        activity.ride_type || 
                        activity.route_type || 
                        "activity";
    
    // Return the final formatted activity
    return {
      ...basicFields,
      gpx_data: gpxData,
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
