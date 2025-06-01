
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

        // After successfully upserting routes, process their trackpoints
        for (let j = 0; j < batch.length; j++) {
          const activity = batch[j];
          const route = routes[j];
          
          // Get the route ID from the response data if available, otherwise use the generated ID
          const insertedRouteData = data && data[j];
          const routeId = insertedRouteData ? insertedRouteData.id : route.id;
          
          console.log(`Processing trackpoints for route: ${routeId}`);
          
          // Insert trackpoints directly from activity
          if (activity.trackpoints && Array.isArray(activity.trackpoints) && activity.trackpoints.length > 0) {
            console.log(`Found ${activity.trackpoints.length} trackpoints in activity, inserting...`);
            const insertedCount = await insertTrackpointsForRoute(client, routeId, activity.trackpoints);
            console.log(`Successfully inserted ${insertedCount} trackpoints for route: ${routeId}`);
          } else {
            console.log(`No trackpoints array found in activity for route ${routeId}`);
          }
          
          // Also try to process and store detailed route points as fallback
          const trackpointCount = await processAndStoreTrackpoints(client, activity, routeId);
          
          if (trackpointCount > 0) {
            console.log(`Successfully processed ${trackpointCount} additional trackpoints for route: ${routeId}`);
          } else if (route.coordinates && Array.isArray(route.coordinates) && route.coordinates.length > 0) {
            // Fall back to basic coordinates if no trackpoints were found
            const pointCount = await upsertRoutePoints(client, routeId, route.coordinates);
            console.log(`Inserted ${pointCount} basic route points for route: ${routeId}`);
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
