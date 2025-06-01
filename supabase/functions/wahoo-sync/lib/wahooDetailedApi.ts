
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
 * Enhanced activity fetcher with better debugging for routes endpoint
 */
export async function fetchWahooActivitiesWithDetails(access_token: string) {
  console.log("=== FETCHING WAHOO ACTIVITIES WITH ENHANCED FIT FILE PROCESSING ===");
  
  // First get the summary list with enhanced debugging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    // CRITICAL: Try routes endpoint ONLY first with detailed debugging
    console.log("=== STEP 1: TRYING ROUTES ENDPOINT ===");
    const routesEndpoint = "https://api.wahooligan.com/v1/routes?limit=25&ignore_cache=true";
    
    try {
      console.log(`Making request to routes endpoint: ${routesEndpoint}`);
      const routesRes = await fetch(routesEndpoint, {
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Accept": "application/json"
        },
        signal: controller.signal,
      });
      
      console.log(`Routes endpoint response status: ${routesRes.status} ${routesRes.statusText}`);
      console.log(`Routes endpoint response headers:`, Object.fromEntries(routesRes.headers.entries()));
      
      if (routesRes.ok) {
        const routesData = await routesRes.json();
        console.log(`Routes endpoint raw response:`, JSON.stringify(routesData, null, 2));
        
        let routesItems = [];
        if (Array.isArray(routesData)) {
          routesItems = routesData;
          console.log(`Routes data is direct array with ${routesItems.length} items`);
        } else if (routesData?.results && Array.isArray(routesData.results)) {
          routesItems = routesData.results;
          console.log(`Routes data has results array with ${routesItems.length} items`);
        } else if (routesData?.data && Array.isArray(routesData.data)) {
          routesItems = routesData.data;
          console.log(`Routes data has data array with ${routesItems.length} items`);
        } else if (routesData?.routes && Array.isArray(routesData.routes)) {
          routesItems = routesData.routes;
          console.log(`Routes data has routes array with ${routesItems.length} items`);
        } else {
          console.log(`Routes response structure not recognized:`, Object.keys(routesData));
        }
        
        if (routesItems.length > 0) {
          console.log(`✓ SUCCESS: Found ${routesItems.length} routes from routes endpoint`);
          console.log(`Sample route data:`, JSON.stringify(routesItems[0], null, 2));
          
          // Process routes with detailed data
          const detailedRoutes = await processRoutesWithDetails(routesItems, access_token);
          
          clearTimeout(timeoutId);
          const formattedActivities = formatWahooActivities(detailedRoutes);
          console.log(`Formatted ${formattedActivities.length} route activities`);
          
          return formattedActivities;
        } else {
          console.log(`✗ Routes endpoint returned empty array`);
        }
      } else {
        const errorText = await routesRes.text();
        console.log(`✗ Routes endpoint failed: ${routesRes.status} - ${errorText}`);
      }
    } catch (routesError) {
      console.error(`✗ Routes endpoint exception:`, routesError);
    }
    
    // Only if routes endpoint fails, try fallback endpoints
    console.log("=== STEP 2: TRYING FALLBACK ENDPOINTS ===");
    const fallbackEndpoints = [
      "https://api.wahooligan.com/v1/workouts?limit=25&ignore_cache=true",
      "https://api.wahooligan.com/v1/workout_history?limit=25&ignore_cache=true", 
      "https://api.wahooligan.com/v1/rides?limit=25&ignore_cache=true"
    ];
    
    let summaryActivities = [];
    
    for (const endpoint of fallbackEndpoints) {
      try {
        console.log(`Trying fallback endpoint: ${endpoint}`);
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
            console.log(`Found ${items.length} activities from fallback ${endpoint}`);
            summaryActivities = [...summaryActivities, ...items];
            break; // Use first successful endpoint
          }
        }
      } catch (err) {
        console.log(`Fallback endpoint failed: ${endpoint}`, err);
        continue;
      }
    }
    
    clearTimeout(timeoutId);
    
    if (summaryActivities.length === 0) {
      console.log("✗ No activities found from any endpoint");
      return [];
    }
    
    console.log(`Got ${summaryActivities.length} fallback activities, processing detailed data...`);
    
    // Now fetch detailed data for fallback activities
    const detailedActivities = await processActivitiesWithDetails(summaryActivities, access_token);
    
    const formattedActivities = formatWahooActivities(detailedActivities);
    console.log(`Formatted ${formattedActivities.length} fallback activities`);
    
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

/**
 * Process routes with detailed data (for routes endpoint)
 */
async function processRoutesWithDetails(routes: any[], access_token: string): Promise<any[]> {
  console.log(`=== PROCESSING ${routes.length} ROUTES WITH DETAILED DATA ===`);
  
  const detailedRoutes = [];
  const maxDetailsToFetch = 15;
  
  for (let i = 0; i < Math.min(routes.length, maxDetailsToFetch); i++) {
    const route = routes[i];
    const routeId = route.id || route.route_id;
    
    if (!routeId) {
      console.log(`Skipping route ${i} - no ID found`);
      detailedRoutes.push(route);
      continue;
    }
    
    console.log(`=== PROCESSING ROUTE ${i + 1}/${Math.min(routes.length, maxDetailsToFetch)}: ${routeId} ===`);
    
    // For routes, the summary data might already contain file URLs
    if (route.file?.url) {
      console.log(`✓ Route ${routeId} already has file URL: ${route.file.url}`);
      route.fit_file_url = route.file.url;
      route.file_url = route.file.url;
      route.needs_fit_processing = true;
    }
    
    // Get detailed data
    const detailedData = await fetchWahooWorkoutDetails(access_token, routeId);
    
    // Merge all data
    let enhancedRoute = { ...route };
    
    if (detailedData) {
      enhancedRoute = { 
        ...enhancedRoute, 
        ...detailedData,
        _hasDetailedData: true 
      };
      
      // Extract FIT file URL
      const fitFileUrl = extractFitFileUrl(detailedData);
      if (fitFileUrl) {
        enhancedRoute.fit_file_url = fitFileUrl;
        enhancedRoute.file_url = fitFileUrl;
        enhancedRoute.needs_fit_processing = true;
        console.log(`✓ Route ${routeId} has FIT file URL: ${fitFileUrl}`);
      }
      
      // Ensure trackpoints are properly structured
      if (detailedData.trackpoints && Array.isArray(detailedData.trackpoints)) {
        enhancedRoute.trackpoints = detailedData.trackpoints;
        console.log(`Enhanced route ${routeId} with ${detailedData.trackpoints.length} trackpoints`);
      }
    }
    
    detailedRoutes.push(enhancedRoute);
  }
  
  // Add remaining routes without detailed data
  for (let i = maxDetailsToFetch; i < routes.length; i++) {
    detailedRoutes.push(routes[i]);
  }
  
  return detailedRoutes;
}

/**
 * Process activities with detailed data (for fallback endpoints)
 */
async function processActivitiesWithDetails(activities: any[], access_token: string): Promise<any[]> {
  console.log(`=== PROCESSING ${activities.length} ACTIVITIES WITH DETAILED DATA ===`);
  
  const detailedActivities = [];
  const maxDetailsToFetch = 15;
  
  for (let i = 0; i < Math.min(activities.length, maxDetailsToFetch); i++) {
    const activity = activities[i];
    const activityId = activity.id || activity.workout_id || activity.ride_id;
    
    if (!activityId) {
      console.log(`Skipping activity ${i} - no ID found`);
      detailedActivities.push(activity);
      continue;
    }
    
    console.log(`=== PROCESSING ACTIVITY ${i + 1}/${Math.min(activities.length, maxDetailsToFetch)}: ${activityId} ===`);
    
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
        enhancedActivity.file_url = fitFileUrl;
        enhancedActivity.needs_fit_processing = true;
        console.log(`✓ Activity ${activityId} has FIT file URL: ${fitFileUrl}`);
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
  for (let i = maxDetailsToFetch; i < activities.length; i++) {
    detailedActivities.push(activities[i]);
  }
  
  return detailedActivities;
}
