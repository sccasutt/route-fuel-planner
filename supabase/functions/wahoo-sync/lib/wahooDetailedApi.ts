
// Wahoo API detailed data fetchers for individual workout/activity details
import { formatWahooActivities } from "./wahooActivityFormatter.ts";

/**
 * Fetch detailed workout data including trackpoints from Wahoo API
 */
export async function fetchWahooWorkoutDetails(access_token: string, workoutId: string): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    console.log(`Fetching detailed data for workout ${workoutId}`);
    
    // Try different endpoints for detailed workout data
    const detailEndpoints = [
      `https://api.wahooligan.com/v1/workouts/${workoutId}?include_trackpoints=true`,
      `https://api.wahooligan.com/v1/workouts/${workoutId}/details`,
      `https://api.wahooligan.com/v1/workouts/${workoutId}/trackpoints`,
      `https://api.wahooligan.com/v1/workouts/${workoutId}`,
      `https://api.wahooligan.com/v1/rides/${workoutId}?include_trackpoints=true`,
      `https://api.wahooligan.com/v1/rides/${workoutId}/details`,
      `https://api.wahooligan.com/v1/rides/${workoutId}`
    ];
    
    for (const endpoint of detailEndpoints) {
      try {
        console.log(`Trying detailed endpoint: ${endpoint}`);
        
        const res = await fetch(endpoint, {
          headers: {
            "Authorization": `Bearer ${access_token}`,
            "Accept": "application/json"
          },
          signal: controller.signal,
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log(`SUCCESS: Got detailed data from ${endpoint}`);
          
          // Log the structure to understand what we got
          if (data.trackpoints && Array.isArray(data.trackpoints)) {
            console.log(`Found ${data.trackpoints.length} trackpoints in detailed response`);
            console.log('Sample trackpoint:', JSON.stringify(data.trackpoints[0]));
          } else if (data.points && Array.isArray(data.points)) {
            console.log(`Found ${data.points.length} points in detailed response`);
            console.log('Sample point:', JSON.stringify(data.points[0]));
          } else if (data.route_points && Array.isArray(data.route_points)) {
            console.log(`Found ${data.route_points.length} route_points in detailed response`);
            console.log('Sample route point:', JSON.stringify(data.route_points[0]));
          }
          
          clearTimeout(timeoutId);
          return data;
        } else {
          console.log(`Endpoint ${endpoint} returned ${res.status}`);
        }
      } catch (endpointErr) {
        console.log(`Error with endpoint ${endpoint}:`, endpointErr);
        continue;
      }
    }
    
    clearTimeout(timeoutId);
    console.log(`No detailed data found for workout ${workoutId}`);
    return null;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error(`Error fetching workout details for ${workoutId}:`, err);
    return null;
  }
}

/**
 * Fetch FIT file data for a workout if available
 */
export async function fetchWahooWorkoutFitFile(access_token: string, workoutId: string): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  
  try {
    console.log(`Fetching FIT file for workout ${workoutId}`);
    
    // Try different endpoints for FIT file access
    const fitEndpoints = [
      `https://api.wahooligan.com/v1/workouts/${workoutId}/fit`,
      `https://api.wahooligan.com/v1/workouts/${workoutId}/file`,
      `https://api.wahooligan.com/v1/workouts/${workoutId}/export`,
      `https://api.wahooligan.com/v1/rides/${workoutId}/fit`,
      `https://api.wahooligan.com/v1/rides/${workoutId}/file`
    ];
    
    for (const endpoint of fitEndpoints) {
      try {
        console.log(`Trying FIT endpoint: ${endpoint}`);
        
        const res = await fetch(endpoint, {
          headers: {
            "Authorization": `Bearer ${access_token}`,
            "Accept": "application/octet-stream, application/fit, */*"
          },
          signal: controller.signal,
        });
        
        if (res.ok) {
          const contentType = res.headers.get("content-type") || "";
          console.log(`SUCCESS: Got FIT file from ${endpoint}, content-type: ${contentType}`);
          
          // Check if it's a direct download URL or file content
          if (contentType.includes("application/json")) {
            // Probably a JSON response with download URL
            const data = await res.json();
            clearTimeout(timeoutId);
            return {
              type: "url",
              url: data.download_url || data.file_url || data.url,
              data: data
            };
          } else {
            // Direct file content
            const fileBlob = await res.blob();
            clearTimeout(timeoutId);
            return {
              type: "content",
              content: fileBlob,
              contentType: contentType,
              endpoint: endpoint
            };
          }
        } else {
          console.log(`FIT endpoint ${endpoint} returned ${res.status}`);
        }
      } catch (endpointErr) {
        console.log(`Error with FIT endpoint ${endpoint}:`, endpointErr);
        continue;
      }
    }
    
    clearTimeout(timeoutId);
    console.log(`No FIT file found for workout ${workoutId}`);
    return null;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error(`Error fetching FIT file for ${workoutId}:`, err);
    return null;
  }
}

/**
 * Enhanced activity fetcher that gets both summary and detailed data
 */
export async function fetchWahooActivitiesWithDetails(access_token: string) {
  console.log("Fetching Wahoo activities with enhanced detailed data extraction...");
  
  // First get the summary list (reuse existing logic)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    // Get summary activities first
    const summaryEndpoints = [
      "https://api.wahooligan.com/v1/workouts?limit=50&ignore_cache=true",
      "https://api.wahooligan.com/v1/workout_history?limit=50&ignore_cache=true", 
      "https://api.wahooligan.com/v1/rides?limit=50&ignore_cache=true"
    ];
    
    let summaryActivities = [];
    
    for (const endpoint of summaryEndpoints) {
      try {
        console.log(`Fetching summary from: ${endpoint}`);
        const res = await fetch(endpoint, {
          headers: {
            "Authorization": `Bearer ${access_token}`,
            "Accept": "application/json"
          },
          signal: controller.signal,
        });
        
        if (res.ok) {
          const data = await res.json();
          
          let items = [];
          if (Array.isArray(data)) {
            items = data;
          } else if (data?.results && Array.isArray(data.results)) {
            items = data.results;
          } else if (data?.data && Array.isArray(data.data)) {
            items = data.data;
          }
          
          if (items.length > 0) {
            console.log(`Found ${items.length} summary activities from ${endpoint}`);
            summaryActivities = [...summaryActivities, ...items];
            break; // Use first successful endpoint
          }
        }
      } catch (err) {
        console.log(`Summary endpoint failed: ${endpoint}`, err);
        continue;
      }
    }
    
    clearTimeout(timeoutId);
    
    if (summaryActivities.length === 0) {
      console.log("No summary activities found");
      return [];
    }
    
    console.log(`Got ${summaryActivities.length} summary activities, fetching detailed data...`);
    
    // Now fetch detailed data for each activity
    const detailedActivities = [];
    const maxDetailsToFetch = 10; // Limit to prevent timeout
    
    for (let i = 0; i < Math.min(summaryActivities.length, maxDetailsToFetch); i++) {
      const activity = summaryActivities[i];
      const activityId = activity.id || activity.workout_id || activity.ride_id;
      
      if (!activityId) {
        console.log(`Skipping activity ${i} - no ID found`);
        detailedActivities.push(activity);
        continue;
      }
      
      console.log(`Fetching details for activity ${i + 1}/${Math.min(summaryActivities.length, maxDetailsToFetch)}: ${activityId}`);
      
      // Get detailed data
      const detailedData = await fetchWahooWorkoutDetails(access_token, activityId);
      
      // Get FIT file if available
      const fitFileData = await fetchWahooWorkoutFitFile(access_token, activityId);
      
      // Merge all data
      let enhancedActivity = { ...activity };
      
      if (detailedData) {
        enhancedActivity = { 
          ...enhancedActivity, 
          ...detailedData,
          _hasDetailedData: true 
        };
        
        // Ensure trackpoints are properly structured
        if (detailedData.trackpoints && Array.isArray(detailedData.trackpoints)) {
          enhancedActivity.trackpoints = detailedData.trackpoints;
          console.log(`Enhanced activity ${activityId} with ${detailedData.trackpoints.length} trackpoints`);
        }
      }
      
      if (fitFileData) {
        enhancedActivity.fit_file_data = fitFileData;
        enhancedActivity.needs_fit_processing = true;
        console.log(`Enhanced activity ${activityId} with FIT file data`);
      }
      
      detailedActivities.push(enhancedActivity);
    }
    
    // Add remaining activities without detailed data
    for (let i = maxDetailsToFetch; i < summaryActivities.length; i++) {
      detailedActivities.push(summaryActivities[i]);
    }
    
    console.log(`Successfully enhanced ${detailedActivities.length} activities with detailed data`);
    
    // Format the activities
    const formattedActivities = formatWahooActivities(detailedActivities);
    console.log(`Formatted ${formattedActivities.length} enhanced activities`);
    
    return formattedActivities;
    
  } catch (err: any) {
    console.error("Error in fetchWahooActivitiesWithDetails:", err);
    throw {
      message: err.message || "Connection error with Wahoo API",
      status: 502,
      details: err.details || err
    };
  }
}
