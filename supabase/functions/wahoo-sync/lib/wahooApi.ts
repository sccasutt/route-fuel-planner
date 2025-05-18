
// Wahoo API endpoint handlers
import { formatWahooActivities } from "./wahooActivityFormatter.ts";

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
    
    // Extract activities array from different response formats
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
    
    // Format the activities with our utility
    const formattedActivities = formatWahooActivities(activities);
    
    // Store debug data
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
