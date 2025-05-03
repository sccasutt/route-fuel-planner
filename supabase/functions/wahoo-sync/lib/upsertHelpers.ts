
// Function that handles inserting or updating profile and routes

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Upserts the Wahoo profile for a user
 */
export async function upsertWahooProfile(client: SupabaseClient, userId: string, wahooUserId: string, profile: any) {
  console.log(`Upserting Wahoo profile for user: ${userId} Wahoo user ID: ${wahooUserId}`);

  // First check if profile already exists
  const { data: existingProfile } = await client
    .from('wahoo_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Get the weight from the profile if available
  const weight = profile.weight ? parseFloat(profile.weight) : null;

  try {
    const { data, error } = await client
      .from('wahoo_profiles')
      .upsert({
        id: userId,
        wahoo_user_id: wahooUserId,
        weight_kg: weight,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error("Error upserting Wahoo profile:", error);
      throw new Error(`Failed to upsert Wahoo profile: ${error.message}`);
    }

    console.log(`Successfully upserted Wahoo profile for user: ${userId}`);
    return existingProfile ? 'updated' : 'created';
  } catch (error: any) {
    console.error("Exception upserting Wahoo profile:", error);
    throw new Error(`Failed to upsert Wahoo profile: ${error.message}`);
  }
}

/**
 * Upserts routes for a user
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
    
    // Transform the activities into the routes schema
    const routes = batch.map(activity => {
      // Parse numeric values properly
      let distance = 0;
      try {
        distance = typeof activity.distance === 'number' 
          ? activity.distance 
          : parseFloat(String(activity.distance || '0'));
      } catch (err) {
        console.error("Error parsing distance:", err, "for activity:", activity.id);
      }
      
      let elevation = 0;
      try {
        elevation = typeof activity.elevation === 'number' 
          ? activity.elevation 
          : parseFloat(String(activity.elevation || '0'));
      } catch (err) {
        console.error("Error parsing elevation:", err, "for activity:", activity.id);
      }
      
      let calories = 0;
      try {
        calories = typeof activity.calories === 'number' 
          ? activity.calories 
          : parseInt(String(activity.calories || '0'), 10);
      } catch (err) {
        console.error("Error parsing calories:", err, "for activity:", activity.id);
      }
      
      // Format the date consistently
      let dateObj;
      try {
        dateObj = new Date(activity.date);
      } catch (err) {
        console.error("Error parsing date:", err, "for activity:", activity.id);
        dateObj = new Date();
      }
      
      // Format duration as string for database
      let duration = activity.duration || '0:00:00';
      if (typeof duration === 'number') {
        // Convert minutes to HH:MM:SS format
        const hours = Math.floor(duration / 60);
        const minutes = Math.floor(duration % 60);
        duration = `${hours}:${minutes.toString().padStart(2, '0')}:00`;
      }
      
      return {
        user_id: userId,
        wahoo_route_id: activity.id.toString(),
        name: activity.name,
        date: dateObj.toISOString(),
        distance: distance,
        elevation: elevation,
        duration: duration,
        calories: calories,
        gpx_data: activity.gpx_data || null
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
