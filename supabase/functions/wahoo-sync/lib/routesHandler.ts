
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
      
      return {
        user_id: userId,
        wahoo_route_id: id,
        name: activity.name || "Unnamed Activity",
        date: new Date(activity.date).toISOString(),
        distance: parseNumericValue(activity.distance),
        elevation: parseNumericValue(activity.elevation),
        duration: activity.duration || "0:01:00",
        duration_seconds: parseNumericValue(activity.duration_seconds, 60),
        calories: parseNumericValue(activity.calories),
        gpx_data: gpxData,
        // Store additional metadata if available
        metadata: activity.additional_data ? JSON.stringify(activity.additional_data) : null,
        type: activity.type || "activity",
        gpx_file_url: activity.gpx_file_url || null
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
