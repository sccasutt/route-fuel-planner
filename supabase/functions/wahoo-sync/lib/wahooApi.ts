
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
    
    // Define multiple endpoints to try in sequence
    // Add the 'ignore_cache=true' parameter to force fresh data
    const endpoints = [
      "https://api.wahooligan.com/v1/workouts?limit=100&ignore_cache=true",
      "https://api.wahooligan.com/v1/rides?limit=100&ignore_cache=true", 
      "https://api.wahooligan.com/v1/routes?limit=100&ignore_cache=true",
      "https://api.wahooligan.com/v1/activities?limit=100&ignore_cache=true"
    ];
    
    let activitiesRes = null;
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
        responseText = await res.text(); // We'll parse this as JSON if successful
        
        if (res.ok) {
          console.log(`Endpoint ${endpoint} response body first 200 chars:`, responseText.substring(0, 200));
          activitiesRes = responseText;
          usedEndpoint = endpoint;
          break;
        } else {
          console.warn(`Error response from endpoint ${endpoint}:`, responseText.substring(0, 200));
        }
      } catch (endpointErr) {
        console.warn(`Error with endpoint ${endpoint}:`, endpointErr);
        // Continue to next endpoint
      }
    }
    
    clearTimeout(timeoutId);

    if (!activitiesRes) {
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
      activitiesData = JSON.parse(activitiesRes);
    } catch (parseErr) {
      console.error("Failed to parse Wahoo API response:", parseErr);
      console.error("Response excerpt:", activitiesRes.substring(0, 500));
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
    console.log("Response sample:", JSON.stringify(activitiesData).substring(0, 300));
    
    // Handle different response formats
    let activities = [];
    
    if (Array.isArray(activitiesData)) {
      // Direct array response
      activities = activitiesData;
    } else if (activitiesData && typeof activitiesData === 'object') {
      // Check if there's a 'results', 'data', or other arrays that might contain the activities
      if (Array.isArray(activitiesData.results)) {
        activities = activitiesData.results;
        console.log("Found activities in 'results' property, count:", activities.length);
      } else if (Array.isArray(activitiesData.data)) {
        activities = activitiesData.data;
        console.log("Found activities in 'data' property, count:", activities.length);
      } else if (activitiesData.workouts && Array.isArray(activitiesData.workouts)) {
        activities = activitiesData.workouts;
        console.log("Found activities in 'workouts' property, count:", activities.length);
      } else {
        // Log all top-level keys to help debug
        console.log("All top-level keys in response:", Object.keys(activitiesData));
        
        // Try to find any array in the object that might contain activities
        for (const key of Object.keys(activitiesData)) {
          if (Array.isArray(activitiesData[key])) {
            console.log(`Found array in '${key}' property with ${activitiesData[key].length} items`);
            if (activitiesData[key].length > 0) {
              activities = activitiesData[key];
              console.log(`Using '${key}' as activities source, first item keys:`, Object.keys(activities[0]));
              break;
            }
          }
        }
        
        if (activities.length === 0) {
          console.warn("Could not find activities array in response structure");
        }
      }
    }
    
    // Log the available activities
    console.log(`Processing ${activities.length} Wahoo activities`);
    
    if (activities.length > 0) {
      console.log("Sample activity:", JSON.stringify(activities[0]));
      console.log("Sample activity keys:", Object.keys(activities[0]));
    } else {
      console.warn("No activities found in Wahoo response");
    }
    
    // Transform activity data to match our expected format
    const formattedActivities = activities.map(activity => {
      // Extract key fields with fallbacks
      const formattedActivity = {
        id: activity.id || activity.workout_id || activity.route_id || `wahoo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: activity.name || activity.title || "Unnamed Activity",
        date: activity.start_time || activity.created_at || activity.timestamp || new Date().toISOString(),
        distance: typeof activity.distance === 'number' 
          ? activity.distance 
          : typeof activity.distance === 'string'
            ? parseFloat(activity.distance)
            : 0,
        elevation: activity.elevation_gain || activity.elevation || 0,
        duration: activity.duration || "0:00:00",
        calories: activity.calories || activity.energy || 0,
        gpx_data: activity.gpx_data || null,
        type: activity.type || activity.workout_type || "activity"
      };
      
      console.log("Transformed activity:", formattedActivity.id, formattedActivity.name);
      return formattedActivity;
    });
    
    console.log(`Successfully formatted ${formattedActivities.length} Wahoo activities`);
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
