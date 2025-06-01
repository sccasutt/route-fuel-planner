
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
    
    // Try routes endpoints first (these return file.url structure), then workout endpoints
    const detailEndpoints = [
      `https://api.wahooligan.com/v1/routes/${workoutId}?include_files=true`,
      `https://api.wahooligan.com/v1/routes/${workoutId}`,
      `https://api.wahooligan.com/v1/workouts/${workoutId}?include_trackpoints=true&include_files=true`,
      `https://api.wahooligan.com/v1/workouts/${workoutId}/details`,
      `https://api.wahooligan.com/v1/workouts/${workoutId}`,
      `https://api.wahooligan.com/v1/rides/${workoutId}?include_trackpoints=true&include_files=true`,
      `https://api.wahooligan.com/v1/rides/${workoutId}/details`,
      `https://api.wahooligan.com/v1/rides/${workoutId}`,
      `https://api.wahooligan.com/v1/workouts/${workoutId}/files`,
      `https://api.wahooligan.com/v1/rides/${workoutId}/files`
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
          
          // Log the complete response structure to understand what we got
          console.log('Full response structure:', JSON.stringify(data, null, 2));
          
          // Enhanced FIT file URL extraction
          const fitFileUrl = extractFitFileUrl(data);
          if (fitFileUrl) {
            data.fit_file_url = fitFileUrl;
            data.file_url = fitFileUrl; // Also set as file_url for compatibility
            console.log(`Found FIT file URL for workout ${workoutId}: ${fitFileUrl}`);
          } else {
            console.log(`No FIT file URL found for workout ${workoutId}`);
            console.log('Available keys in response:', Object.keys(data));
            if (data.file) {
              console.log('File object structure:', JSON.stringify(data.file, null, 2));
            }
          }
          
          clearTimeout(timeoutId);
          return data;
        } else {
          console.log(`Endpoint ${endpoint} returned ${res.status}: ${res.statusText}`);
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
 * Extract FIT file URL from workout data with enhanced detection
 */
export function extractFitFileUrl(workoutData: any): string | null {
  console.log('=== EXTRACTING FIT FILE URL ===');
  console.log('Input data keys:', Object.keys(workoutData));
  
  // Primary check: file.url structure (as shown in sample response)
  if (workoutData.file?.url) {
    console.log(`Found file.url: ${workoutData.file.url}`);
    return workoutData.file.url;
  }
  
  // Check various possible locations for FIT file URL
  const possibleUrls = [
    workoutData.fit_file?.url,
    workoutData.fit_file?.download_url,
    workoutData.download_url,
    workoutData.file_url,
    workoutData.gpx_file_url,
    workoutData.export_url,
    workoutData.data_file_url
  ];
  
  // Check files array
  if (workoutData.files && Array.isArray(workoutData.files)) {
    console.log(`Found ${workoutData.files.length} files in response`);
    for (const file of workoutData.files) {
      console.log('File object:', {
        url: file.url,
        type: file.type,
        format: file.format,
        downloadUrl: file.download_url,
        name: file.name
      });
      
      if (file.type === 'fit' || file.format === 'fit' || 
          file.url?.includes('.fit') || file.name?.includes('.fit')) {
        possibleUrls.push(file.url, file.download_url);
      }
      
      // Sometimes FIT files are labeled differently
      if (file.type === 'tcx' || file.type === 'gpx' || file.type === 'data') {
        possibleUrls.push(file.url, file.download_url);
      }
    }
  }
  
  // Check exports array
  if (workoutData.exports && Array.isArray(workoutData.exports)) {
    console.log(`Found ${workoutData.exports.length} exports in response`);
    for (const exportItem of workoutData.exports) {
      console.log('Export object:', exportItem);
      possibleUrls.push(exportItem.url, exportItem.download_url);
    }
  }
  
  // Find the first valid URL
  for (const url of possibleUrls) {
    if (url && typeof url === 'string' && url.length > 0) {
      console.log(`Found potential file URL: ${url}`);
      return url;
    }
  }
  
  console.log('No file URL found in workout data');
  console.log('Searched in:', {
    hasFile: !!workoutData.file,
    fileKeys: workoutData.file ? Object.keys(workoutData.file) : [],
    hasFiles: !!workoutData.files,
    filesCount: workoutData.files?.length || 0,
    hasExports: !!workoutData.exports,
    exportsCount: workoutData.exports?.length || 0
  });
  return null;
}

/**
 * Download FIT file content with enhanced error handling
 */
export async function downloadFitFile(url: string, access_token: string): Promise<ArrayBuffer | null> {
  try {
    console.log(`=== DOWNLOADING FIT FILE ===`);
    console.log(`URL: ${url}`);
    console.log(`Has access token: ${!!access_token}`);
    
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Accept": "*/*",
        "User-Agent": "Wahoo-Route-Sync/1.0"
      }
    });
    
    console.log(`Download response status: ${response.status} ${response.statusText}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error(`Failed to download FIT file: ${response.status} ${response.statusText}`);
      
      // Try to get error details
      const errorText = await response.text();
      console.error(`Error response body:`, errorText);
      return null;
    }
    
    const fileBuffer = await response.arrayBuffer();
    console.log(`Successfully downloaded FIT file, size: ${fileBuffer.byteLength} bytes`);
    
    // Validate it's actually a FIT file
    if (fileBuffer.byteLength > 14) {
      const headerView = new DataView(fileBuffer, 0, 14);
      const signature = new Uint8Array(fileBuffer, 8, 4);
      const fitSignature = Array.from(signature).map(b => String.fromCharCode(b)).join('');
      
      if (fitSignature === '.FIT') {
        console.log('✓ Validated FIT file signature');
      } else {
        console.warn(`File signature is '${fitSignature}', not '.FIT' - may not be a valid FIT file`);
      }
    }
    
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
  console.log("=== FETCHING WAHOO ACTIVITIES WITH ENHANCED FIT FILE PROCESSING ===");
  
  // First get the summary list
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    // Get summary activities first - prioritize routes endpoints
    const summaryEndpoints = [
      "https://api.wahooligan.com/v1/routes?limit=25&ignore_cache=true",
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
    const maxDetailsToFetch = 15; // Increased to get more detailed data
    
    for (let i = 0; i < Math.min(summaryActivities.length, maxDetailsToFetch); i++) {
      const activity = summaryActivities[i];
      const activityId = activity.id || activity.workout_id || activity.ride_id;
      
      if (!activityId) {
        console.log(`Skipping activity ${i} - no ID found`);
        detailedActivities.push(activity);
        continue;
      }
      
      console.log(`=== PROCESSING ACTIVITY ${i + 1}/${Math.min(summaryActivities.length, maxDetailsToFetch)}: ${activityId} ===`);
      
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
        
        // Extract FIT file URL - this is the critical part
        const fitFileUrl = extractFitFileUrl(detailedData);
        if (fitFileUrl) {
          enhancedActivity.fit_file_url = fitFileUrl;
          enhancedActivity.file_url = fitFileUrl;
          enhancedActivity.needs_fit_processing = true;
          console.log(`✓ Activity ${activityId} has FIT file URL: ${fitFileUrl}`);
        } else {
          console.log(`✗ Activity ${activityId} has no FIT file URL found`);
          console.log('Activity data structure:', Object.keys(detailedData));
        }
        
        // Ensure trackpoints are properly structured
        if (detailedData.trackpoints && Array.isArray(detailedData.trackpoints)) {
          enhancedActivity.trackpoints = detailedData.trackpoints;
          console.log(`Enhanced activity ${activityId} with ${detailedData.trackpoints.length} trackpoints`);
        }
      } else {
        console.log(`No detailed data found for activity ${activityId}`);
      }
      
      detailedActivities.push(enhancedActivity);
    }
    
    // Add remaining activities without detailed data
    for (let i = maxDetailsToFetch; i < summaryActivities.length; i++) {
      detailedActivities.push(summaryActivities[i]);
    }
    
    console.log(`=== SUMMARY ===`);
    console.log(`Successfully enhanced ${detailedActivities.length} activities with detailed data`);
    
    // Count activities with FIT files
    const activitiesWithFitFiles = detailedActivities.filter(a => a.fit_file_url || a.file_url);
    console.log(`Activities with FIT file URLs: ${activitiesWithFitFiles.length}/${detailedActivities.length}`);
    
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
