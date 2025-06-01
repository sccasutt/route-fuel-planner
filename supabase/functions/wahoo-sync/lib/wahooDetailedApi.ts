
// Enhanced Wahoo API detailed data fetchers with workout-first approach
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
 * Extract route IDs from workout data
 */
export function extractRouteIdsFromWorkouts(workouts: any[]): { workoutId: string, routeId: string }[] {
  console.log(`=== EXTRACTING ROUTE IDS FROM ${workouts.length} WORKOUTS ===`);
  
  const routeIds: { workoutId: string, routeId: string }[] = [];
  
  for (const workout of workouts) {
    const workoutId = workout.id || workout.workout_id || workout.activity_id;
    
    // Check various possible fields for route ID
    const routeId = workout.route_id || 
                   workout.route?.id || 
                   workout.activity?.route_id ||
                   workout.segment_id ||
                   workout.course_id;
    
    if (workoutId && routeId) {
      routeIds.push({ workoutId: workoutId.toString(), routeId: routeId.toString() });
      console.log(`Found route ID ${routeId} for workout ${workoutId}`);
    } else {
      console.log(`No route ID found for workout ${workoutId}`);
      console.log('Workout keys:', Object.keys(workout));
      if (workout.route) {
        console.log('Route object keys:', Object.keys(workout.route));
      }
    }
  }
  
  console.log(`Extracted ${routeIds.length} route IDs from ${workouts.length} workouts`);
  return routeIds;
}

/**
 * Batch fetch route details using route IDs
 */
export async function fetchRouteDetailsBatch(access_token: string, routeIds: string[]): Promise<Map<string, any>> {
  console.log(`=== BATCH FETCHING ${routeIds.length} ROUTE DETAILS ===`);
  
  const routeDetailsMap = new Map<string, any>();
  
  // Process in smaller batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < routeIds.length; i += batchSize) {
    const batch = routeIds.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1}: routes ${batch.join(', ')}`);
    
    const batchPromises = batch.map(async (routeId) => {
      try {
        const routeDetail = await fetchRouteDetail(access_token, routeId);
        if (routeDetail) {
          routeDetailsMap.set(routeId, routeDetail);
          console.log(`✓ Fetched route detail for ${routeId}`);
        } else {
          console.log(`✗ Failed to fetch route detail for ${routeId}`);
        }
      } catch (error) {
        console.error(`Error fetching route ${routeId}:`, error);
      }
    });
    
    await Promise.all(batchPromises);
    
    // Small delay between batches to be respectful to the API
    if (i + batchSize < routeIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`Successfully fetched ${routeDetailsMap.size}/${routeIds.length} route details`);
  return routeDetailsMap;
}

/**
 * Fetch individual route detail
 */
export async function fetchRouteDetail(access_token: string, routeId: string): Promise<any> {
  const endpoints = [
    `https://api.wahooligan.com/v1/routes/${routeId}?include_files=true`,
    `https://api.wahooligan.com/v1/routes/${routeId}`,
    `https://api.wahooligan.com/v1/segments/${routeId}?include_files=true`,
    `https://api.wahooligan.com/v1/courses/${routeId}?include_files=true`
  ];
  
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Accept": "application/json"
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log(`Route ${routeId} fetched from ${endpoint}`);
        
        // Extract FIT file URL
        const fitFileUrl = extractFitFileUrl(data);
        if (fitFileUrl) {
          data.fit_file_url = fitFileUrl;
          data.file_url = fitFileUrl;
          console.log(`Route ${routeId} has FIT file: ${fitFileUrl}`);
        }
        
        return data;
      }
    } catch (error) {
      console.log(`Error with route endpoint ${endpoint}:`, error);
      continue;
    }
  }
  
  return null;
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
 * NEW: Enhanced activity fetcher with workout-first approach
 */
export async function fetchWahooActivitiesWithDetails(access_token: string) {
  console.log("=== WORKOUT-FIRST WAHOO ACTIVITIES FETCHER ===");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout for complex workflow
  
  try {
    // STEP 1: Fetch workouts first
    console.log("=== STEP 1: FETCHING WORKOUTS ===");
    const workouts = await fetchWorkouts(access_token);
    
    if (workouts.length === 0) {
      console.log("No workouts found, trying fallback approach");
      clearTimeout(timeoutId);
      return await fallbackToRoutesOnly(access_token);
    }
    
    // STEP 2: Extract route IDs from workouts
    console.log("=== STEP 2: EXTRACTING ROUTE IDS ===");
    const workoutRouteMapping = extractRouteIdsFromWorkouts(workouts);
    
    if (workoutRouteMapping.length === 0) {
      console.log("No route IDs found in workouts, processing workouts as-is");
      clearTimeout(timeoutId);
      const formattedActivities = formatWahooActivities(workouts);
      return formattedActivities;
    }
    
    // STEP 3: Batch fetch route details
    console.log("=== STEP 3: BATCH FETCHING ROUTE DETAILS ===");
    const routeIds = workoutRouteMapping.map(mapping => mapping.routeId);
    const routeDetailsMap = await fetchRouteDetailsBatch(access_token, routeIds);
    
    // STEP 4: Merge workout data with route details
    console.log("=== STEP 4: MERGING WORKOUT AND ROUTE DATA ===");
    const enhancedWorkouts = mergeWorkoutsWithRoutes(workouts, workoutRouteMapping, routeDetailsMap);
    
    clearTimeout(timeoutId);
    const formattedActivities = formatWahooActivities(enhancedWorkouts);
    console.log(`Successfully processed ${formattedActivities.length} activities with workout-first approach`);
    
    return formattedActivities;
    
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("Error in workout-first fetcher:", err);
    throw {
      message: err.message || "Connection error with Wahoo API",
      status: 502,
      details: err.details || err
    };
  }
}

/**
 * Fetch workouts from Wahoo API
 */
async function fetchWorkouts(access_token: string): Promise<any[]> {
  const workoutEndpoints = [
    "https://api.wahooligan.com/v1/workouts?limit=25&ignore_cache=true",
    "https://api.wahooligan.com/v1/workout_history?limit=25&ignore_cache=true",
    "https://api.wahooligan.com/v1/rides?limit=25&ignore_cache=true",
    "https://api.wahooligan.com/v1/activities?limit=25&ignore_cache=true"
  ];
  
  for (const endpoint of workoutEndpoints) {
    try {
      console.log(`Trying workout endpoint: ${endpoint}`);
      
      const res = await fetch(endpoint, {
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Accept": "application/json"
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        let workouts = [];
        if (Array.isArray(data)) {
          workouts = data;
        } else if (data?.results && Array.isArray(data.results)) {
          workouts = data.results;
        } else if (data?.data && Array.isArray(data.data)) {
          workouts = data.data;
        }
        
        if (workouts.length > 0) {
          console.log(`✓ Found ${workouts.length} workouts from ${endpoint}`);
          console.log(`Sample workout:`, JSON.stringify(workouts[0], null, 2));
          return workouts;
        }
      } else {
        console.log(`Workout endpoint ${endpoint} returned ${res.status}`);
      }
    } catch (error) {
      console.log(`Error with workout endpoint ${endpoint}:`, error);
      continue;
    }
  }
  
  console.log("No workouts found from any endpoint");
  return [];
}

/**
 * Merge workout data with route details
 */
function mergeWorkoutsWithRoutes(
  workouts: any[], 
  workoutRouteMapping: { workoutId: string, routeId: string }[], 
  routeDetailsMap: Map<string, any>
): any[] {
  console.log(`Merging ${workouts.length} workouts with route details`);
  
  const enhancedWorkouts = workouts.map(workout => {
    const workoutId = (workout.id || workout.workout_id || workout.activity_id)?.toString();
    
    // Find the route mapping for this workout
    const mapping = workoutRouteMapping.find(m => m.workoutId === workoutId);
    
    if (mapping && routeDetailsMap.has(mapping.routeId)) {
      const routeDetail = routeDetailsMap.get(mapping.routeId);
      console.log(`Enhancing workout ${workoutId} with route ${mapping.routeId}`);
      
      // Merge workout with route details, prioritizing workout data for conflicts
      const enhanced = {
        ...routeDetail, // Route details (including FIT file URLs)
        ...workout, // Workout data (activity metadata)
        _route_id: mapping.routeId,
        _has_route_data: true,
        _enhanced_with_route: true
      };
      
      // Ensure FIT file URL is available
      if (routeDetail.fit_file_url) {
        enhanced.fit_file_url = routeDetail.fit_file_url;
        enhanced.file_url = routeDetail.fit_file_url;
        enhanced.needs_fit_processing = true;
      }
      
      return enhanced;
    } else {
      console.log(`No route detail found for workout ${workoutId}`);
      return {
        ...workout,
        _has_route_data: false
      };
    }
  });
  
  const enhancedCount = enhancedWorkouts.filter(w => w._has_route_data).length;
  console.log(`Enhanced ${enhancedCount}/${workouts.length} workouts with route data`);
  
  return enhancedWorkouts;
}

/**
 * Fallback to routes-only approach if no workouts found
 */
async function fallbackToRoutesOnly(access_token: string): Promise<any[]> {
  console.log("=== FALLBACK: ROUTES-ONLY APPROACH ===");
  
  try {
    const routesEndpoint = "https://api.wahooligan.com/v1/routes?limit=25&ignore_cache=true";
    
    const res = await fetch(routesEndpoint, {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Accept": "application/json"
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      
      let routes = [];
      if (Array.isArray(data)) {
        routes = data;
      } else if (data?.results && Array.isArray(data.results)) {
        routes = data.results;
      } else if (data?.data && Array.isArray(data.data)) {
        routes = data.data;
      }
      
      console.log(`Fallback found ${routes.length} routes`);
      const formattedActivities = formatWahooActivities(routes);
      return formattedActivities;
    }
  } catch (error) {
    console.error("Fallback routes approach failed:", error);
  }
  
  return [];
}
