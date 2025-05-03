
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
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    console.log("Fetching Wahoo activities with access token...");
    
    // Try these endpoints in order, if one fails try the next
    const endpoints = [
      "https://api.wahooligan.com/v1/workouts?limit=50",
      "https://api.wahooligan.com/v1/rides?limit=50", 
      "https://api.wahooligan.com/v1/routes?limit=50"
    ];
    
    let activitiesRes = null;
    let usedEndpoint = "";
    
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
          activitiesRes = res;
          usedEndpoint = endpoint;
          break;
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
    const activitiesData = await activitiesRes.json();
    
    // Debug log to see the exact structure of the response
    console.log("Wahoo API response type:", typeof activitiesData);
    console.log("Is array:", Array.isArray(activitiesData));
    console.log("Response structure:", Object.keys(activitiesData));
    
    // Handle different response formats
    let activities = [];
    
    if (Array.isArray(activitiesData)) {
      // Direct array response
      activities = activitiesData;
    } else if (activitiesData && typeof activitiesData === 'object') {
      // Check if there's a 'results' or 'data' property that might contain the activities
      if (Array.isArray(activitiesData.results)) {
        activities = activitiesData.results;
      } else if (Array.isArray(activitiesData.data)) {
        activities = activitiesData.data;
      } else if (activitiesData.workouts && Array.isArray(activitiesData.workouts)) {
        activities = activitiesData.workouts;
      } else {
        // Log the structure to help debug
        console.log("Unexpected response structure:", Object.keys(activitiesData));
        // Try to extract any array from the object
        const possibleArrays = Object.values(activitiesData).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          activities = possibleArrays[0];
          console.log("Found an array in response with", activities.length, "items");
        }
      }
    }
    
    // Log the available activities
    console.log(`Processing ${activities.length} Wahoo activities`);
    
    if (activities.length > 0) {
      console.log("Sample activity:", JSON.stringify(activities[0]).substring(0, 1000));
    }
    
    // Transform activity data to match our expected format
    const formattedActivities = activities.map(activity => {
      // Extract key fields with fallbacks
      return {
        id: activity.id || `wahoo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: activity.name || activity.title || "Unnamed Activity",
        date: activity.start_time || activity.created_at || new Date().toISOString(),
        distance: typeof activity.distance === 'number' 
          ? activity.distance 
          : typeof activity.distance === 'string'
            ? parseFloat(activity.distance)
            : 0,
        elevation: activity.elevation_gain || activity.elevation || 0,
        duration: activity.duration || "0:00:00",
        calories: activity.calories || 0,
        gpx_data: activity.gpx_data || null
      };
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
