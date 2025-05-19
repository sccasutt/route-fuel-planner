
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { transformActivityToRoute } from "./routeTransformer.ts";
import { upsertRoutePoints, processAndStoreTrackpoints } from "./coordinateHandler.ts";

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
          
          if (route.wahoo_route_id) {
            // Process trackpoints first (more detailed data)
            const trackpointCount = await processAndStoreTrackpoints(client, activity, route.wahoo_route_id);
            
            if (trackpointCount > 0) {
              console.log(`Successfully processed ${trackpointCount} trackpoints for route: ${route.wahoo_route_id}`);
            } else if (route.coordinates && Array.isArray(route.coordinates) && route.coordinates.length > 0) {
              // Fall back to basic coordinates if no trackpoints were found
              const pointCount = await upsertRoutePoints(client, route.wahoo_route_id, route.coordinates);
              console.log(`Inserted ${pointCount} basic route points for route: ${route.wahoo_route_id}`);
            } else {
              console.log(`No coordinates found for route: ${route.wahoo_route_id}`);
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
