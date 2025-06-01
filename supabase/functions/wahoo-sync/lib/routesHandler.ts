
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { transformActivityToRoute } from "./routeTransformer.ts";
import { upsertRoutePoints, processAndStoreTrackpoints } from "./coordinateHandler.ts";
import { insertTrackpointsForRoute } from "./trackpointsHandler.ts";

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
      
      // Check if the sample has trackpoints
      if (batch[0].trackpoints && Array.isArray(batch[0].trackpoints)) {
        console.log(`Sample activity has ${batch[0].trackpoints.length} trackpoints`);
        if (batch[0].trackpoints.length > 0) {
          console.log('First trackpoint sample:', JSON.stringify(batch[0].trackpoints[0]));
        }
      } else {
        console.log('Sample activity has no trackpoints array');
      }
      
      // Check for coordinate data availability
      console.log('Coordinate data analysis for sample activity:');
      console.log(`- trackpoints: ${batch[0].trackpoints?.length || 0}`);
      console.log(`- coordinates: ${batch[0].coordinates?.length || 0}`);
      console.log(`- route_points: ${batch[0].route_points?.length || 0}`);
      console.log(`- gpx_file_url: ${!!batch[0].gpx_file_url}`);
      console.log(`- needs_gpx_processing: ${!!batch[0].needs_gpx_processing}`);
    }
    
    // Transform the activities into the routes schema
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
      } else {
        successCount += routes.length;
        console.log(`Successfully upserted batch ${i / batchSize + 1} with ${routes.length} routes`);

        // After successfully upserting routes, process their trackpoints and coordinates
        for (let j = 0; j < batch.length; j++) {
          const activity = batch[j];
          const route = routes[j];
          
          // Get the route ID from the response data if available, otherwise use the generated ID
          const insertedRouteData = data && data[j];
          const routeId = insertedRouteData ? insertedRouteData.id : route.id;
          
          console.log(`Processing coordinate data for route: ${routeId}`);
          
          // STEP 1: Insert trackpoints directly from activity
          if (activity.trackpoints && Array.isArray(activity.trackpoints) && activity.trackpoints.length > 0) {
            console.log(`Found ${activity.trackpoints.length} trackpoints in activity, inserting...`);
            const insertedCount = await insertTrackpointsForRoute(client, routeId, activity.trackpoints);
            console.log(`Successfully inserted ${insertedCount} trackpoints for route: ${routeId}`);
          } else {
            console.log(`No trackpoints array found in activity for route ${routeId}`);
          }
          
          // STEP 2: Process and store detailed route points as fallback
          const trackpointCount = await processAndStoreTrackpoints(client, activity, routeId);
          
          if (trackpointCount > 0) {
            console.log(`Successfully processed ${trackpointCount} additional trackpoints for route: ${routeId}`);
          } else if (route.coordinates && Array.isArray(route.coordinates) && route.coordinates.length > 0) {
            // STEP 3: Fall back to basic coordinates if no trackpoints were found
            const pointCount = await upsertRoutePoints(client, routeId, route.coordinates);
            console.log(`Inserted ${pointCount} basic route points for route: ${routeId}`);
          } else {
            console.log(`No coordinate data found for route: ${routeId}`);
            
            // STEP 4: If we still have no coordinates but there's a GPX file, mark it for processing
            if (activity.needs_gpx_processing && activity.gpx_file_url) {
              console.log(`Route ${routeId} requires GPX file processing from: ${activity.gpx_file_url}`);
              
              // Call the GPX parser edge function to extract coordinates
              try {
                const gpxResult = await client.functions.invoke('gpx-parser', {
                  body: {
                    route_id: routeId,
                    gpx_file_url: activity.gpx_file_url,
                    file_type: activity.file_type || 'unknown'
                  }
                });
                
                if (gpxResult.error) {
                  console.error(`GPX parsing failed for route ${routeId}:`, gpxResult.error);
                } else {
                  console.log(`GPX parsing initiated for route ${routeId}`);
                }
              } catch (gpxError) {
                console.error(`Error calling GPX parser for route ${routeId}:`, gpxError);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error(`Exception upserting batch ${i / batchSize + 1}:`, error);
    }
  }

  console.log(`Successfully upserted ${successCount}/${activities.length} routes for user: ${userId}`);
  return successCount;
}
