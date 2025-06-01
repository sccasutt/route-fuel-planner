
// Enhanced Wahoo API detailed data fetchers with proper FIT file handling
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
      `https://api.wahooligan.com/v1/workouts/${workoutId}?include_trackpoints=true&include_files=true`,
      `https://api.wahooligan.com/v1/workouts/${workoutId}/details`,
      `https://api.wahooligan.com/v1/workouts/${workoutId}`,
      `https://api.wahooligan.com/v1/rides/${workoutId}?include_trackpoints=true&include_files=true`,
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
          console.log('Response structure:', {
            hasTrackpoints: !!data.trackpoints,
            trackpointsCount: data.trackpoints?.length || 0,
            hasFiles: !!data.files,
            filesCount: data.files?.length || 0,
            hasFile: !!data.file,
            hasFitFile: !!data.fit_file,
            hasGpxFile: !!data.gpx_file,
            hasDownloadUrl: !!data.download_url,
            hasFileUrl: !!data.file_url
          });
          
          // Look for FIT file references in various formats
          if (data.files && Array.isArray(data.files)) {
            console.log(`Found ${data.files.length} files in response`);
            data.files.forEach((file: any, index: number) => {
              console.log(`File ${index}:`, {
                url: file.url,
                type: file.type,
                format: file.format,
                downloadUrl: file.download_url
              });
            });
          }
          
          if (data.file) {
            console.log('Found file object:', {
              url: data.file.url,
              type: data.file.type,
              downloadUrl: data.file.download_url
            });
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
 * Extract FIT file URL from workout data
 */
export function extractFitFileUrl(workoutData: any): string | null {
  // Check various possible locations for FIT file URL
  const possibleUrls = [
    workoutData.fit_file?.url,
    workoutData.fit_file?.download_url,
    workoutData.file?.url,
    workoutData.file?.download_url,
    workoutData.download_url,
    workoutData.file_url,
    workoutData.gpx_file_url // Sometimes FIT files are labeled as GPX
  ];
  
  // Check files array
  if (workoutData.files && Array.isArray(workoutData.files)) {
    for (const file of workoutData.files) {
      if (file.type === 'fit' || file.format === 'fit' || file.url?.includes('.fit')) {
        possibleUrls.push(file.url, file.download_url);
      }
    }
  }
  
  // Find the first valid URL
  for (const url of possibleUrls) {
    if (url && typeof url === 'string' && url.length > 0) {
      console.log(`Found FIT file URL: ${url}`);
      return url;
    }
  }
  
  console.log('No FIT file URL found in workout data');
  return null;
}

/**
 * Download FIT file content
 */
export async function downloadFitFile(url: string, access_token: string): Promise<ArrayBuffer | null> {
  try {
    console.log(`Downloading FIT file from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Accept": "*/*"
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to download FIT file: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const fileBuffer = await response.arrayBuffer();
    console.log(`Successfully downloaded FIT file, size: ${fileBuffer.byteLength} bytes`);
    
    return fileBuffer;
  } catch (error) {
    console.error(`Error downloading FIT file from ${url}:`, error);
    return null;
  }
}

/**
 * Enhanced activity fetcher that gets detailed data and FIT files
 */
export async function fetchWahooActivitiesWithDetails(access_token: string) {
  console.log("Fetching Wahoo activities with enhanced FIT file processing...");
  
  // First get the summary list
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    // Get summary activities first
    const summaryEndpoints = [
      "https://api.wahooligan.com/v1/workouts?limit=25&ignore_cache=true",
      "https://api.wahooligan.com/v1/workout_history?limit=25&ignore_cache=true", 
      "https://api.wahooligan.com/v1/rides?limit=25&ignore_cache=true"
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
    
    console.log(`Got ${summaryActivities.length} summary activities, processing detailed data...`);
    
    // Now fetch detailed data and FIT files for each activity
    const detailedActivities = [];
    const maxDetailsToFetch = 5; // Reduced to prevent timeout
    
    for (let i = 0; i < Math.min(summaryActivities.length, maxDetailsToFetch); i++) {
      const activity = summaryActivities[i];
      const activityId = activity.id || activity.workout_id || activity.ride_id;
      
      if (!activityId) {
        console.log(`Skipping activity ${i} - no ID found`);
        detailedActivities.push(activity);
        continue;
      }
      
      console.log(`Processing activity ${i + 1}/${Math.min(summaryActivities.length, maxDetailsToFetch)}: ${activityId}`);
      
      // Get detailed data
      const detailedData = await fetchWahooWorkoutDetails(access_token, activityId);
      
      // Merge all data
      let enhancedActivity = { ...activity };
      
      if (detailedData) {
        enhancedActivity = { 
          ...enhancedActivity, 
          ...detailedData,
          _hasDetailedData: true 
        };
        
        // Extract FIT file URL
        const fitFileUrl = extractFitFileUrl(detailedData);
        if (fitFileUrl) {
          enhancedActivity.fit_file_url = fitFileUrl;
          enhancedActivity.needs_fit_processing = true;
          console.log(`Activity ${activityId} has FIT file: ${fitFileUrl}`);
        }
        
        // Ensure trackpoints are properly structured
        if (detailedData.trackpoints && Array.isArray(detailedData.trackpoints)) {
          enhancedActivity.trackpoints = detailedData.trackpoints;
          console.log(`Enhanced activity ${activityId} with ${detailedData.trackpoints.length} trackpoints`);
        }
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
