
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

        // After successfully upserting routes, process their coordinates and trackpoints
        for (let j = 0; j < batch.length; j++) {
          const activity = batch[j];
          const route = routes[j];
          const insertedRouteId = data && data[j] ? data[j].id : route.wahoo_route_id;
          
          if (insertedRouteId) {
            console.log(`Processing data for route: ${insertedRouteId}`);
            
            // 1. Insert trackpoints directly from activity
            if (activity.trackpoints && Array.isArray(activity.trackpoints)) {
              await insertTrackpointsForRoute(client, insertedRouteId, activity.trackpoints);
            }
            
            // 2. Process and store detailed route points
            const trackpointCount = await processAndStoreTrackpoints(client, activity, insertedRouteId);
            
            if (trackpointCount > 0) {
              console.log(`Successfully processed ${trackpointCount} trackpoints for route: ${insertedRouteId}`);
            } else if (route.coordinates && Array.isArray(route.coordinates) && route.coordinates.length > 0) {
              // Fall back to basic coordinates if no trackpoints were found
              const pointCount = await upsertRoutePoints(client, insertedRouteId, route.coordinates);
              console.log(`Inserted ${pointCount} basic route points for route: ${insertedRouteId}`);
            } else {
              console.log(`No coordinates found for route: ${insertedRouteId}`);
            }
          } else {
            console.error(`Could not determine route ID for upsertion result`);
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
