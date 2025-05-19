
import { parseNumericValue } from "./wahooUtils.ts";

/**
 * Process coordinates data from activity
 */
export function processCoordinates(activity: any): any[] | null {
  // Try to parse coordinates from activity data
  let coordinates = null;
  
  if (activity.coordinates) {
    if (typeof activity.coordinates === 'string') {
      try {
        coordinates = JSON.parse(activity.coordinates);
      } catch (e) {
        console.warn(`Could not parse coordinates for route:`, e);
        coordinates = null;
      }
    } else {
      // Already an object
      coordinates = activity.coordinates;
    }
  }
  
  // If we have trackpoints/waypoints, convert them to coordinates
  if (!coordinates && activity.trackpoints && Array.isArray(activity.trackpoints)) {
    coordinates = activity.trackpoints.map((tp: any) => [
      parseNumericValue(tp.lat),
      parseNumericValue(tp.lng)
    ]).filter((coord: [number, number]) => 
      !isNaN(coord[0]) && !isNaN(coord[1]) && coord[0] !== 0 && coord[1] !== 0
    );
  }
  
  return coordinates;
}

/**
 * Function to extract and store route_points (trackpoints) for a specific route
 */
export async function upsertRoutePoints(client: any, routeId: string, coordinates: any[]) {
  try {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      console.log(`No valid coordinates to upsert for route: ${routeId}`);
      return 0;
    }
    
    console.log(`Starting to upsert ${coordinates.length} route points for route: ${routeId}`);
    
    // Delete existing points first to avoid duplicates
    const { error: deleteError } = await client
      .from('route_points')
      .delete()
      .eq('route_id', routeId);
      
    if (deleteError) {
      console.error(`Error deleting existing route points:`, deleteError);
    }
    
    // Process in batches to avoid size limits
    const batchSize = 100;
    let successCount = 0;
    
    for (let i = 0; i < coordinates.length; i += batchSize) {
      const batch = coordinates.slice(i, i + batchSize);
      
      // Transform coordinates into route_points schema
      const points = batch.map((coord, index) => {
        let latitude, longitude, elevation = null, time = null;
        
        // Handle different coordinate formats
        if (Array.isArray(coord)) {
          latitude = parseNumericValue(coord[0]);
          longitude = parseNumericValue(coord[1]);
          elevation = coord.length > 2 ? parseNumericValue(coord[2]) : null;
          time = coord.length > 3 ? coord[3] : null;
        } else if (typeof coord === 'object') {
          // Object format like {lat: x, lng: y}
          latitude = parseNumericValue(coord.lat !== undefined ? coord.lat : coord.latitude);
          longitude = parseNumericValue(coord.lng !== undefined ? coord.lng : coord.longitude);
          elevation = parseNumericValue(coord.ele !== undefined ? coord.ele : coord.elevation);
          time = coord.time || coord.timestamp || null;
        }
        
        return {
          route_id: routeId,
          lat: latitude,
          lng: longitude,
          elevation: elevation,
          recorded_at: time,
          sequence_index: i + index
        };
      }).filter(point => 
        !isNaN(point.lat) && !isNaN(point.lng) && 
        point.lat !== 0 && point.lng !== 0
      );
      
      if (points.length === 0) continue;
      
      try {
        const { error } = await client
          .from('route_points')
          .insert(points);
          
        if (error) {
          console.error(`Error inserting points batch ${i / batchSize + 1}:`, error);
        } else {
          successCount += points.length;
          console.log(`Successfully inserted points batch ${i / batchSize + 1} with ${points.length} points`);
        }
      } catch (error: any) {
        console.error(`Exception inserting points batch ${i / batchSize + 1}:`, error);
      }
    }
    
    console.log(`Successfully inserted ${successCount}/${coordinates.length} points for route: ${routeId}`);
    return successCount;
  } catch (error) {
    console.error(`Error processing route points:`, error);
    return 0;
  }
}
