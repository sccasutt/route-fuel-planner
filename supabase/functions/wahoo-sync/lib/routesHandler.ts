
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { transformActivityToRoute } from "./routeTransformer.ts";
import { processEnhancedTrackpoints } from "./enhancedCoordinateProcessor.ts";

/**
 * Enhanced routes upsert with FIT file processing and detailed trackpoint storage
 */
export async function upsertRoutes(client: SupabaseClient, userId: string, activities: any[], accessToken: string) {
  console.log(`=== ENHANCED ROUTES UPSERT WITH FIT FILE PROCESSING ===`);
  console.log(`Processing ${activities.length} activities for user: ${userId}`);

  if (!activities || activities.length === 0) {
    console.log(`No activities to upsert for user: ${userId}`);
    return 0;
  }

  let successCount = 0;

  // Process activities in smaller batches for better performance
  const batchSize = 5; // Reduced for FIT file processing
  for (let i = 0; i < activities.length; i += batchSize) {
    const batch = activities.slice(i, i + batchSize);
    
    console.log(`=== PROCESSING BATCH ${i / batchSize + 1} ===`);
    console.log(`Batch size: ${batch.length} activities`);
    
    // Log detailed info about first activity in each batch
    if (batch.length > 0) {
      const sample = batch[0];
      console.log(`Sample activity analysis:`);
      console.log(`  - ID: ${sample.id || sample.workout_id || 'unknown'}`);
      console.log(`  - Name: ${sample.name || 'unnamed'}`);
      console.log(`  - Has detailed data: ${!!sample._hasDetailedData}`);
      console.log(`  - Trackpoints count: ${sample.trackpoints?.length || 0}`);
      console.log(`  - Has FIT file URL: ${!!(sample.fit_file_url || sample.file?.url)}`);
      console.log(`  - FIT file URL: ${sample.fit_file_url || sample.file?.url || 'none'}`);
      console.log(`  - Duration: ${sample.duration || 'unknown'}`);
      console.log(`  - Distance: ${sample.distance || 'unknown'}km`);
    }
    
    // Transform activities to route schema
    const routes = batch.map(activity => transformActivityToRoute(activity, userId));

    try {
      const { data, error } = await client
        .from('routes')
        .upsert(routes, {
          onConflict: 'user_id,wahoo_route_id',
          returning: 'representation'
        });

      if (error) {
        console.error(`Error upserting batch ${i / batchSize + 1}:`, error);
        continue;
      }

      successCount += routes.length;
      console.log(`Successfully upserted batch ${i / batchSize + 1} with ${routes.length} routes`);

      // Process FIT files and detailed data for each route in the batch
      for (let j = 0; j < batch.length; j++) {
        const activity = batch[j];
        const route = routes[j];
        
        // Get the actual route ID from the database response
        const insertedRouteData = data && data[j];
        const routeId = insertedRouteData ? insertedRouteData.id : route.id;
        
        console.log(`=== PROCESSING FIT FILE AND TRACKPOINTS FOR ROUTE ${routeId} ===`);
        
        // Add access token to activity for FIT file download
        if (activity.fit_file_url || activity.file?.url) {
          activity._access_token = accessToken;
        }
        
        // Use enhanced coordinate processor
        const result = await processEnhancedTrackpoints(client, routeId, activity);
        
        console.log(`Route ${routeId} processing result:`);
        console.log(`  - Trackpoints stored: ${result.trackpointCount}`);
        console.log(`  - Coordinates stored: ${result.coordinateCount}`);
        console.log(`  - Calories calculated: ${result.caloriesCalculated ? 'YES' : 'NO'}`);
        
        // If we have a FIT file URL but no trackpoints, trigger FIT processing
        if (result.trackpointCount === 0 && result.coordinateCount === 0 && route.gpx_file_url) {
          console.log(`Triggering FIT file processing for route ${routeId}`);
          
          try {
            const { error: fitError } = await client.functions.invoke('gpx-parser', {
              body: {
                route_id: routeId,
                gpx_file_url: route.gpx_file_url,
                file_type: 'fit'
              }
            });
            
            if (fitError) {
              console.error(`FIT processing failed for route ${routeId}:`, fitError);
            } else {
              console.log(`FIT processing initiated for route ${routeId}`);
            }
          } catch (fitError) {
            console.error(`Error calling FIT parser for route ${routeId}:`, fitError);
          }
        }
        
        if (result.trackpointCount === 0 && result.coordinateCount === 0) {
          console.warn(`WARNING: No coordinate data stored for route ${routeId}`);
        }
      }

    } catch (error: any) {
      console.error(`Exception upserting batch ${i / batchSize + 1}:`, error);
    }
  }

  console.log(`=== UPSERT COMPLETE ===`);
  console.log(`Successfully upserted ${successCount}/${activities.length} routes for user: ${userId}`);
  
  return successCount;
}
