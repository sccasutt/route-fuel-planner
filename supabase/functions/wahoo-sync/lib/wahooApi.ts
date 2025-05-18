export async function fetchWahooProfile(access_token: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    console.log("Fetching Wahoo profile with access token...");
    const profileRes = await fetch("https://api.wahooligan.com/v1/user", {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Accept": "application/json"
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Log the HTTP status and response headers for debugging
    console.log("Wahoo profile API response status:", profileRes.status);
    
    if (!profileRes.ok) {
      const errorText = await profileRes.text();
      console.error("Failed to fetch Wahoo profile:", profileRes.status, errorText);
      throw {
        message: "Failed to fetch Wahoo profile",
        status: 502,
        details: errorText,
        httpStatus: profileRes.status
      };
    }

    const profile = await profileRes.json();
    console.log("Successfully fetched Wahoo profile with ID:", profile.id);
    
    // Return the full profile object
    return profile;
  } catch (err: any) {
    console.error("Error in fetchWahooProfile:", err);
    throw {
      message: err.message || "Connection error with Wahoo API",
      status: 502,
      details: err.details || err
    };
  }
}

export async function fetchWahooActivities(access_token: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // Longer timeout for activities
  try {
    console.log("Fetching Wahoo activities with access token...");
    
    // Define multiple endpoints to try in sequence with cache busting
    const endpoints = [
      "https://api.wahooligan.com/v1/workouts?limit=100&ignore_cache=true",
      "https://api.wahooligan.com/v1/rides?limit=100&ignore_cache=true", 
      "https://api.wahooligan.com/v1/routes?limit=100&ignore_cache=true",
      "https://api.wahooligan.com/v1/activities?limit=100&ignore_cache=true"
    ];
    
    let activitiesResponse = null;
    let usedEndpoint = "";
    let responseText = "";
    
    // Try each endpoint until we get a successful response
    for (const endpoint of endpoints) {
      console.log(`Trying Wahoo endpoint: ${endpoint}`);
      try {
        const res = await fetch(endpoint, {
          headers: {
            "Authorization": `Bearer ${access_token}`,
            "Accept": "application/json"
          },
          signal: controller.signal,
        });
        
        console.log(`Endpoint ${endpoint} response status:`, res.status);
        
        if (res.ok) {
          responseText = await res.text();
          console.log(`Endpoint ${endpoint} returned success. Response sample:`, responseText.substring(0, 200));
          activitiesResponse = responseText;
          usedEndpoint = endpoint;
          break;
        } else {
          const errorText = await res.text();
          console.warn(`Error response from endpoint ${endpoint}:`, errorText.substring(0, 200));
        }
      } catch (endpointErr) {
        console.warn(`Error with endpoint ${endpoint}:`, endpointErr);
        // Continue to next endpoint
      }
    }
    
    clearTimeout(timeoutId);

    if (!activitiesResponse) {
      throw {
        message: "Failed to fetch Wahoo activities from all endpoints",
        status: 502,
        details: "All API endpoints returned errors",
        httpStatus: 502
      };
    }

    console.log(`Successfully connected to Wahoo API using endpoint: ${usedEndpoint}`);
    
    // Parse the response text as JSON
    let activitiesData;
    try {
      activitiesData = JSON.parse(activitiesResponse);
    } catch (parseErr) {
      console.error("Failed to parse Wahoo API response:", parseErr);
      console.error("Response excerpt:", activitiesResponse.substring(0, 500));
      throw {
        message: "Invalid JSON response from Wahoo API",
        status: 502,
        details: String(parseErr),
        httpStatus: 500
      };
    }
    
    // Debug log to see the exact structure of the response
    console.log("Wahoo API response type:", typeof activitiesData);
    console.log("Is array:", Array.isArray(activitiesData));
    console.log("Response structure:", Object.keys(activitiesData));
    
    // Handle different response formats to extract activities
    let activities = [];
    
    if (Array.isArray(activitiesData)) {
      // Direct array response
      activities = activitiesData;
    } else if (activitiesData && typeof activitiesData === 'object') {
      // Check for common container properties
      if (Array.isArray(activitiesData.results)) {
        activities = activitiesData.results;
      } else if (Array.isArray(activitiesData.data)) {
        activities = activitiesData.data;
      } else if (activitiesData.workouts && Array.isArray(activitiesData.workouts)) {
        activities = activitiesData.workouts;
      } else {
        // Try to find any array property that might contain activities
        for (const key of Object.keys(activitiesData)) {
          if (Array.isArray(activitiesData[key]) && activitiesData[key].length > 0) {
            activities = activitiesData[key];
            console.log(`Using '${key}' array with ${activities.length} items as activities source`);
            break;
          }
        }
      }
    }
    
    if (activities.length === 0) {
      console.warn("No activities found in Wahoo API response");
      return [];
    }
    
    console.log(`Processing ${activities.length} Wahoo activities`);
    
    if (activities.length > 0) {
      console.log("Sample activity keys:", Object.keys(activities[0]));
      console.log("Sample activity (first 1000 chars):", JSON.stringify(activities[0]).substring(0, 1000));
    }
    
    // Deep extraction helper function
    const extractNestedValue = (obj: any, paths: string[]): any => {
      if (!obj) return null;
      
      for (const path of paths) {
        const parts = path.split('.');
        let value = obj;
        let foundPath = true;
        
        for (const part of parts) {
          if (value && value[part] !== undefined) {
            value = value[part];
          } else {
            foundPath = false;
            break;
          }
        }
        
        if (foundPath && value !== undefined && value !== null) {
          return value;
        }
      }
      return null;
    };
    
    // Transform activity data with robust fallback extraction
    const formattedActivities = activities.map(activity => {
      // Extract ID with fallbacks
      const id = extractNestedValue(activity, ['id', 'workout_id', 'route_id']) || 
                `wahoo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Extract name with fallbacks
      const name = extractNestedValue(activity, ['name', 'title', 'workout_name']) || "Unnamed Activity";
      
      // Extract date with fallbacks
      const dateValue = extractNestedValue(activity, [
        'start_time', 'starts', 'created_at', 'timestamp', 
        'workout_summary.created_at', 'date'
      ]) || new Date().toISOString();
      
      // Extract distance with fallbacks
      let distance = extractNestedValue(activity, [
        'distance', 
        'workout_summary.distance_accum',
        'summary.distance',
        'total_distance',
        'distance_km'
      ]);
      
      // Extract elevation with fallbacks
      let elevation = extractNestedValue(activity, [
        'elevation', 
        'elevation_gain',
        'workout_summary.ascent_accum',
        'summary.elevation',
        'altitude_gain',
        'total_ascent',
        'ascent'
      ]);
      
      // Extract calories with fallbacks
      let calories = extractNestedValue(activity, [
        'calories', 
        'energy',
        'workout_summary.calories_accum',
        'summary.calories',
        'total_calories',
        'kcal'
      ]);
      
      // Extract duration with improved fallbacks for various formats
      let durationValue = extractNestedValue(activity, [
        'duration',
        'workout_summary.duration_total_accum',
        'minutes',
        'summary.duration',
        'duration_seconds',
        'elapsed_time',
        'moving_time'
      ]);
      
      // Improved duration processing with better time format handling
      let duration;
      if (typeof durationValue === 'number') {
        // Handle seconds format (most common from API)
        if (durationValue > 30) { // Likely seconds if over 30
          const hours = Math.floor(durationValue / 3600);
          const minutes = Math.floor((durationValue % 3600) / 60);
          const seconds = Math.floor(durationValue % 60);
          duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          // Small number might be hours
          duration = `${Math.floor(durationValue)}:00:00`;
        }
      } else if (typeof durationValue === 'string') {
        // Handle string format - could be "HH:MM:SS", "MM:SS", or just text
        const timePattern = /^(\d+:)?(\d{1,2}:)?\d{1,2}$/;
        if (timePattern.test(durationValue)) {
          // Already a time format string
          const parts = durationValue.split(':');
          if (parts.length === 1) {
            // Just seconds
            duration = `0:00:${parts[0].padStart(2, '0')}`;
          } else if (parts.length === 2) {
            // MM:SS format - add hours
            duration = `0:${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
          } else {
            // Already HH:MM:SS
            duration = `${parts[0]}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
          }
        } else {
          // Not a time format, try to parse as number
          const numericTime = parseFloat(durationValue);
          if (!isNaN(numericTime)) {
            if (numericTime > 30) { // Likely seconds
              const hours = Math.floor(numericTime / 3600);
              const minutes = Math.floor((numericTime % 3600) / 60);
              const seconds = Math.floor(numericTime % 60);
              duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else { // Likely hours or minutes
              if (numericTime < 3) { // Probably hours
                duration = `${Math.floor(numericTime)}:00:00`;
              } else { // Probably minutes
                const hours = Math.floor(numericTime / 60);
                const minutes = Math.floor(numericTime % 60);
                duration = `${hours}:${minutes.toString().padStart(2, '0')}:00`;
              }
            }
          } else {
            duration = "0:00:00"; // Default when we can't parse
          }
        }
      } else {
        duration = "0:00:00"; // Default duration
      }
      
      // Convert numeric values correctly
      if (typeof distance === 'string') distance = parseFloat(distance) || 0;
      if (typeof elevation === 'string') elevation = parseFloat(elevation) || 0;
      if (typeof calories === 'string') calories = parseInt(calories, 10) || 0;
      
      // Ensure all values are numbers, not null/undefined
      distance = typeof distance === 'number' && !isNaN(distance) ? distance : 0;
      elevation = typeof elevation === 'number' && !isNaN(elevation) ? elevation : 0;
      calories = typeof calories === 'number' && !isNaN(calories) ? calories : 0;
      
      // Convert distance to kilometers if needed
      if (distance > 1000 && distance < 1000000) {
        distance = distance / 1000;
      }
      
      const formattedActivity = {
        id,
        name,
        date: dateValue,
        distance,
        elevation,
        duration,
        calories,
        gpx_data: activity.gpx_data || null,
        type: activity.type || activity.workout_type || "activity"
      };
      
      return formattedActivity;
    });
    
    console.log(`Successfully formatted ${formattedActivities.length} Wahoo activities`);
    
    // Log a sample of the formatted activities
    if (formattedActivities.length > 0) {
      console.log("Sample formatted activity:", formattedActivities[0]);
    }
    
    // Store the raw and formatted activities for debugging
    if (typeof window !== 'undefined') {
      try {
        // Store the raw response for debugging
        localStorage.setItem("wahoo_last_activities_raw", activitiesResponse);
        // Store the formatted activities for the debugger component
        localStorage.setItem("wahoo_last_activities_response", JSON.stringify(formattedActivities));
      } catch (storageErr) {
        console.warn("Failed to store Wahoo activities in localStorage:", storageErr);
      }
    }

    return formattedActivities;
  } catch (err: any) {
    console.error("Error in fetchWahooActivities:", err);
    throw {
      message: err.message || "Connection error with Wahoo API",
      status: 502,
      details: err.details || err
    };
  }
}
