
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
    // Use the correct endpoint for Wahoo workouts/activities
    const activitiesRes = await fetch("https://api.wahooligan.com/v1/workouts", {
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

    const activities = await activitiesRes.json();
    
    // Improved logging to help with debugging
    if (Array.isArray(activities)) {
      console.log(`Successfully fetched ${activities.length} Wahoo activities`);
      
      // Transform activity data to match our expected format
      const formattedActivities = activities.map(activity => ({
        id: activity.id || `wahoo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: activity.name || "Unnamed Activity",
        date: activity.start_time || new Date().toISOString(),
        distance: typeof activity.distance === 'number' ? activity.distance : 0,
        elevation: activity.elevation_gain || 0,
        duration: activity.duration || "0:00:00",
        calories: activity.calories || 0,
        gpx_data: activity.gpx_data || null
      }));
      
      return formattedActivities;
    } else {
      console.log("Wahoo activities response is not an array:", typeof activities);
      // Return empty array if we don't get a proper response
      return [];
    }
  } catch (err: any) {
    console.error("Error in fetchWahooActivities:", err);
    throw {
      message: err.message || "Connection error with Wahoo API",
      status: 502,
      details: err.details || err
    };
  }
}
