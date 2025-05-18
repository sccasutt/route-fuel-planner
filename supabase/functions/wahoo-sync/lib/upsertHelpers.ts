
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
 * Improved function to parse numeric values safely
 */
function parseNumericValue(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  
  if (typeof value === 'number') {
    return !isNaN(value) ? value : defaultValue;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) ? parsed : defaultValue;
  }
  
  return defaultValue;
}

/**
 * Upserts routes for a user with improved data parsing
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
    
    // Transform the activities into the routes schema with improved parsing
    const routes = batch.map(activity => {
      // Extract values with robust parsing
      
      // Parse distance with various fallback paths
      let distance = 0;
      if (activity.distance !== undefined) {
        distance = parseNumericValue(activity.distance);
      } else if (activity.workout_summary?.distance_accum) {
        distance = parseNumericValue(activity.workout_summary.distance_accum);
      } else if (activity.distance_accum) {
        distance = parseNumericValue(activity.distance_accum);
      } else if (activity.total_distance) {
        distance = parseNumericValue(activity.total_distance);
      }
      
      // Convert distance from meters to kilometers if needed
      if (distance > 1000 && distance < 1000000) {
        console.log(`Converting large distance value ${distance} to kilometers`);
        distance = distance / 1000; // Convert meters to kilometers
      }
      
      // Handle elevation with various fallback paths
      let elevation = 0;
      if (activity.elevation !== undefined) {
        elevation = parseNumericValue(activity.elevation);
      } else if (activity.elevation_gain !== undefined) {
        elevation = parseNumericValue(activity.elevation_gain);
      } else if (activity.workout_summary?.ascent_accum) {
        elevation = parseNumericValue(activity.workout_summary.ascent_accum);
      } else if (activity.altitude_gain) {
        elevation = parseNumericValue(activity.altitude_gain);
      } else if (activity.total_ascent) {
        elevation = parseNumericValue(activity.total_ascent);
      }
      
      // Handle calories with various fallback paths
      let calories = 0;
      if (activity.calories !== undefined) {
        calories = parseNumericValue(activity.calories, 0);
      } else if (activity.energy !== undefined) {
        calories = parseNumericValue(activity.energy, 0);
      } else if (activity.workout_summary?.calories_accum) {
        calories = parseNumericValue(activity.workout_summary.calories_accum, 0);
      }
      
      // Format the date consistently
      let dateObj;
      try {
        // Try different date fields
        const dateSource = activity.date || activity.starts || activity.start_time || activity.created_at || new Date();
        dateObj = new Date(dateSource);
        if (isNaN(dateObj.getTime())) {
          console.warn("Invalid date detected:", dateSource);
          dateObj = new Date(); // Fallback to current date
        }
      } catch (err) {
        console.error("Error parsing date for activity:", activity.id, err);
        dateObj = new Date();
      }
      
      // Handle duration with better parsing
      let duration = "0:00:00";
      if (activity.duration) {
        if (typeof activity.duration === 'number') {
          // Convert seconds to HH:MM:SS format
          const totalSeconds = Math.round(activity.duration);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else if (typeof activity.duration === 'string') {
          duration = activity.duration;
          
          // Make sure the string format is HH:MM:SS
          const parts = duration.split(':');
          if (parts.length === 2) {
            // MM:SS format, convert to H:MM:SS
            duration = `0:${duration}`;
          }
        }
      } else if (activity.workout_summary?.duration_total_accum) {
        // Convert seconds to HH:MM:SS
        const totalSeconds = Math.round(parseFloat(activity.workout_summary.duration_total_accum));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else if (activity.minutes) {
        const hours = Math.floor(activity.minutes / 60);
        const minutes = Math.floor(activity.minutes % 60);
        duration = `${hours}:${minutes.toString().padStart(2, '0')}:00`;
      }
      
      // Get a proper ID
      const id = activity.id?.toString() || activity.workout_id?.toString() || activity.route_id?.toString() || 
        `wahoo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Log the processed values for the first activity
      if (i === 0 && activity === batch[0]) {
        console.log("Processed activity values:", {
          id,
          name: activity.name || activity.title || "Unnamed Activity",
          date: dateObj.toISOString(),
          distance,
          elevation,
          calories,
          duration
        });
      }
      
      return {
        user_id: userId,
        wahoo_route_id: id,
        name: activity.name || activity.title || "Unnamed Activity",
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
