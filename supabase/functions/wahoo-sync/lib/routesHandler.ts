
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { formatDurationString, durationToSeconds, parseNumericValue } from "./wahooUtils.ts";

/**
 * Upserts routes for a user with improved data parsing according to Wahoo API documentation
 */
export async function upsertRoutes(client: SupabaseClient, userId: string, activities: any[]) {
  console.log(`Upserting routes for user: ${userId} Activities count: ${activities.length}`);

  if (!activities || activities.length === 0) {
    console.log(`No activities to upsert for user: ${userId}`);
    return 0;
  }

  let successCount = 0;

  // Process activities in batches to avoid potential size limits
  const batchSize = 20;
  for (let i = 0; i < activities.length; i += batchSize) {
    const batch = activities.slice(i, i + batchSize);
    
    // Log sample activity for debugging
    if (i === 0 && batch.length > 0) {
      console.log(`Sample activity for insertion:`, JSON.stringify(batch[0], null, 2));
    }
    
    // Transform the activities into the routes schema with improved parsing based on API doc
    const routes = batch.map(activity => {
      // Get a proper ID (prefer wahoo_route_id if present)
      const id = activity.id?.toString() || activity.wahoo_id?.toString() || activity.route_id?.toString() || 
        `wahoo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Extract GPS data from activity
      let gpxData = activity.gpx_data || null;
      
      // Store file URL if available
      const gpxFileUrl = activity.gpx_file_url || activity.file?.url || null;
      
      if (gpxFileUrl) {
        console.log(`Storing file URL: ${gpxFileUrl} for route: ${id}`);
      }
      
      // Store start coordinates if available
      const startLat = activity.start_lat || null;
      const startLng = activity.start_lng || null;
      
      if (startLat && startLng) {
        console.log(`Storing start coordinates: ${startLat},${startLng} for route: ${id}`);
      }

      // Calculate duration_seconds if it doesn't exist
      let durationSeconds = parseNumericValue(activity.duration_seconds);
      if (!durationSeconds && activity.duration) {
        durationSeconds = durationToSeconds(activity.duration);
      }
      
      // Ensure coordinates are properly stored
      let coordinates = null;
      
      // Try to parse coordinates from activity data
      if (activity.coordinates) {
        if (typeof activity.coordinates === 'string') {
          try {
            coordinates = JSON.parse(activity.coordinates);
          } catch (e) {
            console.warn(`Could not parse coordinates for route ${id}:`, e);
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
      
      // Extract power data if available for energy calculations
      const avgPower = parseNumericValue(activity.average_power) || parseNumericValue(activity.avg_power);
      
      // Extract or calculate calories if available
      const calories = parseNumericValue(activity.calories) || parseNumericValue(activity.kcal) || 0;
      
      return {
        user_id: userId,
        wahoo_route_id: id,
        name: activity.name || "Unnamed Activity",
        date: new Date(activity.date).toISOString(),
        distance: parseNumericValue(activity.distance),
        elevation: parseNumericValue(activity.elevation),
        duration: activity.duration || "0:01:00",
        duration_seconds: durationSeconds || 60,
        calories: parseNumericValue(activity.calories),
        // Add new fields for energy calculations
        calories_power_based: avgPower ? (avgPower * durationSeconds * 0.24) / 3600 : null,
        calories_estimated: !avgPower ? calories : null,
        // Store initial macronutrient values (will be refined by the worker job)
        fat_grams: calories ? (calories * 0.3) / 9 : null,
        carb_grams: calories ? (calories * 0.65) / 4 : null,
        protein_grams: calories ? (calories * 0.05) / 4 : null,
        // Add average power if available
        average_power: avgPower,
        gpx_data: gpxData,
        // Store coordinates directly in the JSONB field
        coordinates: coordinates,
        // Store additional metadata if available
        metadata: activity.additional_data ? JSON.stringify({
          ...activity.additional_data,
          start_lat: startLat,
          start_lng: startLng,
          has_file: !!gpxFileUrl,
          file_type: activity.file_type || "unknown"
        }) : null,
        type: activity.type || "activity",
        gpx_file_url: gpxFileUrl,
        start_lat: parseNumericValue(startLat),
        start_lng: parseNumericValue(startLng)
      };
    });

    try {
      const { data, error } = await client
        .from('routes')
        .upsert(routes, {
          onConflict: 'user_id,wahoo_route_id'
        });

      if (error) {
        console.error(`Error upserting batch ${i / batchSize + 1}:`, error);
      } else {
        successCount += routes.length;
        console.log(`Successfully upserted batch ${i / batchSize + 1} with ${routes.length} routes`);
      }
    } catch (error: any) {
      console.error(`Exception upserting batch ${i / batchSize + 1}:`, error);
    }
  }

  console.log(`Successfully upserted ${successCount}/${activities.length} routes for user: ${userId}`);
  return successCount;
}

// Function to extract and store route_points (trackpoints) for a specific route
export async function upsertRoutePoints(client: SupabaseClient, routeId: string, coordinates: any[]) {
  try {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      console.log(`No valid coordinates to upsert for route: ${routeId}`);
      return 0;
    }
    
    console.log(`Upserting ${coordinates.length} route points for route: ${routeId}`);
    
    // Process in batches to avoid size limits
    const batchSize = 100;
    let successCount = 0;
    
    // First, check if points already exist for this route to avoid duplicates
    const { data: existingPoints, error: checkError } = await client
      .from('route_points')
      .select('count')
      .eq('route_id', routeId);
    
    if (checkError) {
      console.error(`Error checking existing points:`, checkError);
      // Continue anyway and try to insert
    } else if (existingPoints && existingPoints.length > 0 && existingPoints[0].count > 0) {
      console.log(`${existingPoints[0].count} points already exist for route ${routeId}, skipping insertion`);
      return 0;
    }
    
    for (let i = 0; i < coordinates.length; i += batchSize) {
      const batch = coordinates.slice(i, i + batchSize);
      
      // Transform coordinates into route_points schema
      const points = batch.map((coord, index) => {
        const latitude = parseNumericValue(coord[0]);
        const longitude = parseNumericValue(coord[1]);
        const elevation = coord.length > 2 ? parseNumericValue(coord[2]) : null;
        const time = coord.length > 3 ? coord[3] : null;
        
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
