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
      
      // Handle duration with improved normalization to match app format (H:MM:SS)
      let duration = "0:01:00"; // Default
      let durationSeconds = 60; // Default to 1 minute
      
      if (activity.duration) {
        if (typeof activity.duration === 'string') {
          // Check if it's already in H:MM:SS format
          const timeFormat = activity.duration.match(/^(\d+):(\d+):(\d+)$/);
          if (timeFormat) {
            // Keep hours without leading zeros, ensure minutes and seconds have leading zeros
            const hours = parseInt(timeFormat[1], 10);
            const minutes = parseInt(timeFormat[2], 10);
            const seconds = parseInt(timeFormat[3], 10);
            
            // Format as H:MM:SS (no leading zero for hours)
            duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            durationSeconds = hours * 3600 + minutes * 60 + seconds;
          } else {
            // For other formats, convert to H:MM:SS
            durationSeconds = durationToSeconds(activity.duration);
            
            // Format seconds to H:MM:SS
            const hours = Math.floor(durationSeconds / 3600);
            const minutes = Math.floor((durationSeconds % 3600) / 60);
            const seconds = Math.floor(durationSeconds % 60);
            
            duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }
        } else if (typeof activity.duration === 'number') {
          // If duration is a number, assume it's seconds and convert to H:MM:SS
          durationSeconds = activity.duration > 0 ? activity.duration : 60;
          
          const hours = Math.floor(durationSeconds / 3600);
          const minutes = Math.floor((durationSeconds % 3600) / 60);
          const seconds = Math.floor(durationSeconds % 60);
          
          duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
      } else if (activity.workout_summary?.duration_total_accum) {
        // Convert seconds to H:MM:SS
        const seconds = parseFloat(activity.workout_summary.duration_total_accum);
        durationSeconds = seconds > 0 ? seconds : 60;
        
        // Format to H:MM:SS
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const secs = Math.floor(durationSeconds % 60);
        duration = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else if (activity.minutes) {
        durationSeconds = activity.minutes * 60; // Convert minutes to seconds
        
        // Format to H:MM:SS
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const secs = Math.floor(durationSeconds % 60);
        duration = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else if (activity.moving_time) {
        durationSeconds = parseNumericValue(activity.moving_time);
        
        // Format to H:MM:SS
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const secs = Math.floor(durationSeconds % 60);
        duration = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else if (activity.elapsed_time) {
        durationSeconds = parseNumericValue(activity.elapsed_time);
        
        // Format to H:MM:SS
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const secs = Math.floor(durationSeconds % 60);
        duration = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      
      // Ensure duration_seconds is never zero or negative
      if (durationSeconds <= 0) {
        durationSeconds = 60; // Minimum 1 minute
        duration = "0:01:00";
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
