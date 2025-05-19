
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { extractTrackpoints } from "./extractCoordinates.ts";

/**
 * Process coordinates from route/activity data
 */
export function processCoordinates(activity: any): [number, number][] {
  if (!activity) return [];

  // Extract coordinates from different possible sources
  let coordinates: [number, number][] = [];

  // If activity has a coordinates array and it's not empty, use that
  if (Array.isArray(activity.coordinates) && activity.coordinates.length > 0) {
    coordinates = activity.coordinates
      .filter((coord: any) => Array.isArray(coord) && coord.length === 2)
      .map((coord: any) => [coord[0], coord[1]]) as [number, number][];
  }

  // If we have trackpoints or route_points, convert them to coordinates
  if (!coordinates.length && (Array.isArray(activity.trackpoints) || Array.isArray(activity.route_points))) {
    const points = activity.trackpoints || activity.route_points;
    coordinates = points
      .filter((point: any) => point.lat && (point.lng || point.lon))
      .map((point: any) => {
        const lat = point.lat;
        const lng = point.lng || point.lon;
        return [lat, lng] as [number, number];
      });
  }

  return coordinates;
}

/**
 * Insert or update route points in the database
 */
export async function upsertRoutePoints(client: SupabaseClient, routeId: string, coordinates: any[]): Promise<number> {
  if (!routeId || !coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    console.log(`No route points to upsert for route: ${routeId}`);
    return 0;
  }

  console.log(`Upserting ${coordinates.length} route points for route: ${routeId}`);
  
  // First delete any existing points for this route to avoid duplicates
  const { error: deleteError } = await client
    .from('route_points')
    .delete()
    .eq('route_id', routeId);
    
  if (deleteError) {
    console.error(`Error deleting existing route points for route ${routeId}:`, deleteError);
    return 0;
  }

  try {
    // Process in batches to avoid payload size limits
    const batchSize = 100; // Process 100 points at a time to avoid payload size limits
    let insertedCount = 0;

    for (let i = 0; i < coordinates.length; i += batchSize) {
      const batch = coordinates.slice(i, i + batchSize);
      
      // Transform coordinates to route_points structure
      const points = batch.map((coord: any, index: number) => {
        // If coord is already a point object
        if (typeof coord === 'object' && !Array.isArray(coord)) {
          return {
            route_id: routeId,
            sequence_index: i + index,
            lat: coord.lat,
            lng: coord.lng || coord.lon,
            elevation: coord.elevation || coord.ele || coord.alt || null,
            recorded_at: coord.timestamp || coord.time || null
          };
        }
        
        // If coord is a simple [lat, lng] array
        if (Array.isArray(coord)) {
          return {
            route_id: routeId,
            sequence_index: i + index,
            lat: coord[0],
            lng: coord[1],
            elevation: coord.length > 2 ? coord[2] : null
          };
        }
        
        return null;
      }).filter(point => point !== null);

      if (points.length === 0) continue;

      const { error } = await client
        .from('route_points')
        .insert(points);

      if (error) {
        console.error(`Error inserting route points batch ${i/batchSize + 1}:`, error);
      } else {
        insertedCount += points.length;
        console.log(`Inserted ${points.length} route points for batch ${i/batchSize + 1}`);
      }
    }

    console.log(`Successfully inserted ${insertedCount} route points for route ${routeId}`);
    return insertedCount;
  } catch (error) {
    console.error(`Error upserting route points for route ${routeId}:`, error);
    return 0;
  }
}

/**
 * Process and store detailed trackpoints from an activity
 */
export async function processAndStoreTrackpoints(client: SupabaseClient, activity: any, routeId: string): Promise<number> {
  if (!routeId || !activity) {
    console.log(`Missing route ID or activity data for trackpoint processing`);
    return 0;
  }
  
  console.log(`Processing trackpoints for route ${routeId}`);
  
  // Extract detailed trackpoints with all available metrics
  const trackpoints = extractTrackpoints(activity);
  
  if (!trackpoints || trackpoints.length === 0) {
    console.log(`No trackpoints found for route ${routeId}`);
    return 0;
  }
  
  console.log(`Found ${trackpoints.length} trackpoints for route ${routeId}`);
  
  // Insert the trackpoints as route_points
  return await upsertRoutePoints(client, routeId, trackpoints);
}
