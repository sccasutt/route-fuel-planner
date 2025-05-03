
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
    
    // First try the workouts endpoint
    const activitiesRes = await fetch("https://api.wahooligan.com/v1/workouts?limit=50", {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Accept": "application/json"
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!activitiesRes.ok) {
      const errorText = await activitiesRes.text();
      console.error("Failed to fetch Wahoo activities:", activitiesRes.status, errorText);
      throw {
        message: "Failed to fetch Wahoo activities",
        status: 502,
        details: errorText,
        httpStatus: activitiesRes.status
      };
    }

    const activitiesData = await activitiesRes.json();
    
    // Debug log to see the exact structure of the response
    console.log("Wahoo API response type:", typeof activitiesData);
    console.log("Is array:", Array.isArray(activitiesData));
    
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
    
    // Transform activity data to match our expected format
    const formattedActivities = activities.map(activity => {
      // Log a sample activity to debug its structure
      if (activities.indexOf(activity) === 0) {
        console.log("Sample activity structure:", JSON.stringify(activity).substring(0, 500) + "...");
      }
      
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
