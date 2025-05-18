
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
    
    // Define API endpoints following Wahoo API documentation
    const endpoints = [
      // Primary endpoints based on Wahoo API documentation
      "https://api.wahooligan.com/v1/workouts?limit=100&ignore_cache=true",
      "https://api.wahooligan.com/v1/workout_history?limit=100&ignore_cache=true",
      "https://api.wahooligan.com/v1/workouts/history?limit=100&ignore_cache=true",
      
      // Secondary endpoints - rides and routes
      "https://api.wahooligan.com/v1/rides?limit=100&ignore_cache=true", 
      "https://api.wahooligan.com/v1/routes?limit=100&ignore_cache=true"
    ];
    
    let activitiesData = [];
    let successfulEndpoints = [];
    
    // Try each endpoint for different data types according to Wahoo docs
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
          const data = await res.json();
          
          // Determine what kind of data we got based on endpoint and structure
          let items = [];
          
          // Extract the array of items from different possible response formats
          if (Array.isArray(data)) {
            items = data;
          } else if (data?.results && Array.isArray(data.results)) {
            items = data.results;
          } else if (data?.data && Array.isArray(data.data)) {
            items = data.data;
          } else if (data?.workouts && Array.isArray(data.workouts)) {
            items = data.workouts;
          } else if (data?.rides && Array.isArray(data.rides)) {
            items = data.rides;
          } else {
            // Try to find any array in the response
            for (const key of Object.keys(data)) {
              if (Array.isArray(data[key]) && data[key].length > 0) {
                console.log(`Found array in key: ${key} with ${data[key].length} items`);
                items = data[key];
                break;
              }
            }
          }
          
          if (items.length > 0) {
            console.log(`Found ${items.length} items from endpoint ${endpoint}`);
            activitiesData = [...activitiesData, ...items];
            successfulEndpoints.push(endpoint);
          }
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

    if (activitiesData.length === 0) {
      if (successfulEndpoints.length > 0) {
        console.log("API calls succeeded but no activities were found");
        return [];
      }
      
      throw {
        message: "Failed to fetch Wahoo activities from all endpoints",
        status: 502,
        details: "All API endpoints returned errors",
        httpStatus: 502
      };
    }

    console.log(`Successfully retrieved ${activitiesData.length} activities from Wahoo API using endpoints: ${successfulEndpoints.join(', ')}`);
    
    // Format the activities with our formatter
    const formattedActivities = formatWahooActivities(activitiesData);
    console.log(`Formatted ${formattedActivities.length} activities`);
    
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
