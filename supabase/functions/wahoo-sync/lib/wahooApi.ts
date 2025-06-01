
// Wahoo API endpoint handlers
import { formatWahooActivities } from "./wahooActivityFormatter.ts";
import { fetchWahooActivitiesWithDetails } from "./wahooDetailedApi.ts";

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
  console.log("=== ENHANCED WAHOO ACTIVITIES FETCHER ===");
  console.log("Using new detailed data extraction approach...");
  
  try {
    // Use the new enhanced fetcher that gets detailed trackpoint data
    const activities = await fetchWahooActivitiesWithDetails(access_token);
    
    console.log(`=== FINAL RESULT ===`);
    console.log(`Successfully fetched ${activities.length} activities with enhanced data`);
    
    // Log statistics about what data we got
    let activitiesWithTrackpoints = 0;
    let activitiesWithCoordinates = 0;
    let activitiesWithPower = 0;
    let activitiesWithFitFiles = 0;
    
    activities.forEach((activity, index) => {
      if (activity.trackpoints && Array.isArray(activity.trackpoints) && activity.trackpoints.length > 0) {
        activitiesWithTrackpoints++;
        
        // Check for power data
        const hasPower = activity.trackpoints.some((tp: any) => tp.power && tp.power > 0);
        if (hasPower) activitiesWithPower++;
      }
      
      if (activity.coordinates && Array.isArray(activity.coordinates) && activity.coordinates.length > 0) {
        activitiesWithCoordinates++;
      }
      
      if (activity.fit_file_data || activity.needs_fit_processing) {
        activitiesWithFitFiles++;
      }
      
      // Log first few activities in detail
      if (index < 3) {
        console.log(`Activity ${index + 1} (${activity.id || activity.name}):`);
        console.log(`  - Trackpoints: ${activity.trackpoints?.length || 0}`);
        console.log(`  - Coordinates: ${activity.coordinates?.length || 0}`);
        console.log(`  - Has FIT file: ${!!(activity.fit_file_data || activity.needs_fit_processing)}`);
        console.log(`  - Has power data: ${activity.trackpoints?.some((tp: any) => tp.power > 0) || false}`);
        console.log(`  - Duration: ${activity.duration || 'unknown'}`);
        console.log(`  - Distance: ${activity.distance || 'unknown'}km`);
      }
    });
    
    console.log(`=== DATA QUALITY SUMMARY ===`);
    console.log(`Activities with trackpoints: ${activitiesWithTrackpoints}/${activities.length}`);
    console.log(`Activities with coordinates: ${activitiesWithCoordinates}/${activities.length}`);
    console.log(`Activities with power data: ${activitiesWithPower}/${activities.length}`);
    console.log(`Activities with FIT files: ${activitiesWithFitFiles}/${activities.length}`);
    
    return activities;
  } catch (err: any) {
    console.error("Error in enhanced fetchWahooActivities:", err);
    throw {
      message: err.message || "Connection error with Wahoo API",
      status: 502,
      details: err.details || err
    };
  }
}

// Helper function to download FIT file and extract coordinates
export async function downloadAndProcessFitFile(url: string, access_token: string) {
  try {
    console.log(`Downloading file from ${url}...`);
    
    const fileRes = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Accept": "*/*"
      }
    });
    
    if (!fileRes.ok) {
      console.error(`Failed to download file: ${fileRes.status}`);
      return null;
    }

    // Extract file as blob
    const fileBlob = await fileRes.blob();
    
    // We'll handle the file processing and parsing in the existing gpx-parser function
    // Return the file content as ArrayBuffer ready for processing
    const fileBuffer = await fileBlob.arrayBuffer();
    
    return {
      buffer: fileBuffer,
      contentType: fileRes.headers.get("content-type") || "application/octet-stream",
      url: url
    };
  } catch (error) {
    console.error(`Error downloading file from ${url}:`, error);
    return null;
  }
}
