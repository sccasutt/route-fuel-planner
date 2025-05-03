
// Function that handles inserting or updating profile and routes

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

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
    
    // Log sample activity for debugging
    if (i === 0 && batch.length > 0) {
      console.log(`Sample activity for insertion:`, {
        id: batch[0].id,
        name: batch[0].name,
        distance: batch[0].distance,
        elevation: batch[0].elevation,
        calories: batch[0].calories,
        type: typeof batch[0].distance
      });
    }
    
    // Transform the activities into the routes schema
    const routes = batch.map(activity => {
      // Improved parsing for numeric values
      
      // Parse distance
      let distance = 0;
      if (typeof activity.distance === 'number' && !isNaN(activity.distance)) {
        distance = activity.distance;
      } else if (typeof activity.distance === 'string') {
        try {
          const parsed = parseFloat(activity.distance);
          distance = !isNaN(parsed) ? parsed : 0;
        } catch (err) {
          console.error("Error parsing distance:", err, "for activity:", activity.id);
        }
      }
      
      // Parse elevation
      let elevation = 0;
      if (typeof activity.elevation === 'number' && !isNaN(activity.elevation)) {
        elevation = activity.elevation;
      } else if (typeof activity.elevation === 'string') {
        try {
          const parsed = parseFloat(activity.elevation);
          elevation = !isNaN(parsed) ? parsed : 0;
        } catch (err) {
          console.error("Error parsing elevation:", err, "for activity:", activity.id);
        }
      }
      
      // Parse calories
      let calories = 0;
      if (typeof activity.calories === 'number' && !isNaN(activity.calories)) {
        calories = activity.calories;
      } else if (typeof activity.calories === 'string') {
        try {
          const parsed = parseInt(activity.calories, 10);
          calories = !isNaN(parsed) ? parsed : 0;
        } catch (err) {
          console.error("Error parsing calories:", err, "for activity:", activity.id);
        }
      }
      
      // Format the date consistently
      let dateObj;
      try {
        dateObj = new Date(activity.date);
        if (isNaN(dateObj.getTime())) {
          console.warn("Invalid date detected:", activity.date);
          dateObj = new Date(); // Fallback to current date
        }
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
      
      // Log the processed values for the first activity
      if (i === 0 && activity === batch[0]) {
        console.log("Processed numeric values:", {
          distance: distance,
          elevation: elevation,
          calories: calories,
          date: dateObj.toISOString()
        });
      }
      
      return {
        user_id: userId,
        wahoo_route_id: activity.id.toString(),
        name: activity.name || "Unnamed Activity",
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
