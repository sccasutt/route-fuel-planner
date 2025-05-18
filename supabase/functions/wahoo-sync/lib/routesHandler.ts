
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { formatDurationString, durationToSeconds, parseNumericValue } from "./wahooUtils.ts";

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
      
      // Handle duration with improved normalization to ensure proper storage format (HH:MM:SS)
      let duration = "0:00:00";
      let durationSeconds = 60; // Default to 1 minute
      
      if (activity.duration) {
        // First normalize the duration string to ensure consistent format
        if (typeof activity.duration === 'string') {
          // Check if it's already in HH:MM:SS format but has very large hours
          const largeHourFormat = activity.duration.match(/^(\d+):(\d+):(\d+)$/);
          if (largeHourFormat) {
            // Convert large hour values to standard format
            const hours = parseInt(largeHourFormat[1], 10);
            const minutes = parseInt(largeHourFormat[2], 10);
            const seconds = parseInt(largeHourFormat[3], 10);
            
            // Normalize the duration to standard HH:MM:SS format
            // This ensures we don't have durations like "162:26:00"
            duration = `${hours % 24}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            durationSeconds = hours * 3600 + minutes * 60 + seconds;
          } else {
            // For other formats, use our formatter function
            duration = formatDurationString(activity.duration);
            durationSeconds = durationToSeconds(activity.duration);
          }
        } else if (typeof activity.duration === 'number') {
          // If duration is a number, assume it's seconds and convert
          durationSeconds = activity.duration > 0 ? activity.duration : 60;
          duration = formatDurationString(durationSeconds);
        }
      } else if (activity.workout_summary?.duration_total_accum) {
        // Convert seconds to HH:MM:SS
        const seconds = parseFloat(activity.workout_summary.duration_total_accum);
        durationSeconds = seconds > 0 ? seconds : 60;
        
        // Format to standard HH:MM:SS
        const hours = Math.floor(durationSeconds / 3600) % 24;
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const secs = Math.floor(durationSeconds % 60);
        duration = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else if (activity.minutes) {
        durationSeconds = activity.minutes * 60; // Convert minutes to seconds
        
        // Format to standard HH:MM:SS
        const hours = Math.floor(durationSeconds / 3600) % 24;
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const secs = Math.floor(durationSeconds % 60);
        duration = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else if (activity.moving_time) {
        durationSeconds = parseNumericValue(activity.moving_time);
        
        // Format to standard HH:MM:SS
        const hours = Math.floor(durationSeconds / 3600) % 24;
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const secs = Math.floor(durationSeconds % 60);
        duration = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else if (activity.elapsed_time) {
        durationSeconds = parseNumericValue(activity.elapsed_time);
        
        // Format to standard HH:MM:SS
        const hours = Math.floor(durationSeconds / 3600) % 24;
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const secs = Math.floor(durationSeconds % 60);
        duration = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      
      // Ensure duration_seconds is never zero or negative
      if (durationSeconds <= 0) {
        durationSeconds = 60; // Minimum 1 minute
        duration = "0:01:00";
      }
      
      // Ensure duration is in the expected format (H:MM:SS)
      const durationParts = duration.split(':');
      if (durationParts.length === 3) {
        // Already in HH:MM:SS format, ensure hours is not excessively large
        const hours = parseInt(durationParts[0], 10) % 24; // Limit to 24 hour format
        duration = `${hours}:${durationParts[1].padStart(2, '0')}:${durationParts[2].padStart(2, '0')}`;
      }
      
      // Get a proper ID
      const id = activity.id?.toString() || activity.workout_id?.toString() || activity.route_id?.toString() || 
        `wahoo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      return {
        user_id: userId,
        wahoo_route_id: id,
        name: activity.name || activity.title || "Unnamed Activity",
        date: dateObj.toISOString(),
        distance: distance,
        elevation: elevation,
        duration: duration,
        duration_seconds: durationSeconds,
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
