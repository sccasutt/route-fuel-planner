
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
  const timeoutId = setTimeout(() => controller.abort(), 15000);
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
          
          // DETAILED LOGGING: Log the complete structure of the first activity
          if (Array.isArray(data) && data.length > 0) {
            console.log(`DETAILED ACTIVITY STRUCTURE from ${endpoint}:`, JSON.stringify(data[0], null, 2));
          } else if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
            console.log(`DETAILED ACTIVITY STRUCTURE from ${endpoint}:`, JSON.stringify(data.results[0], null, 2));
          } else if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
            console.log(`DETAILED ACTIVITY STRUCTURE from ${endpoint}:`, JSON.stringify(data.data[0], null, 2));
          }
          
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
          } else if (data?.routes && Array.isArray(data.routes)) {
            items = data.routes;
          } else {
            // Try to find any array in the response
            for (const key of Object.keys(data)) {
              if (Array.isArray(data[key]) && data[key].length > 0) {
                console.log(`Found array in key: ${key} with ${data[key].length} items`);
                console.log(`Sample item structure:`, JSON.stringify(data[key][0], null, 2));
                items = data[key];
                break;
              }
            }
          }
          
          // Enhanced logging for coordinate data detection
          if (items.length > 0) {
            const sampleItem = items[0];
            console.log(`COORDINATE DATA ANALYSIS for sample from ${endpoint}:`);
            console.log(`- Has trackpoints: ${!!sampleItem.trackpoints} (${sampleItem.trackpoints?.length || 0} items)`);
            console.log(`- Has coordinates: ${!!sampleItem.coordinates} (${sampleItem.coordinates?.length || 0} items)`);
            console.log(`- Has route_points: ${!!sampleItem.route_points} (${sampleItem.route_points?.length || 0} items)`);
            console.log(`- Has waypoints: ${!!sampleItem.waypoints} (${sampleItem.waypoints?.length || 0} items)`);
            console.log(`- Has gpx_data: ${!!sampleItem.gpx_data}`);
            console.log(`- Has file URL: ${!!sampleItem.file?.url}`);
            console.log(`- Has path data: ${!!sampleItem.path} (${sampleItem.path?.length || 0} items)`);
            console.log(`- Has latlng data: ${!!sampleItem.latlng} (${sampleItem.latlng?.length || 0} items)`);
            console.log(`- Has track_points: ${!!sampleItem.track_points} (${sampleItem.track_points?.length || 0} items)`);
            
            // Log sample coordinate if available
            if (sampleItem.trackpoints && sampleItem.trackpoints.length > 0) {
              console.log(`Sample trackpoint:`, JSON.stringify(sampleItem.trackpoints[0], null, 2));
            }
            if (sampleItem.coordinates && sampleItem.coordinates.length > 0) {
              console.log(`Sample coordinate:`, JSON.stringify(sampleItem.coordinates[0], null, 2));
            }
            if (sampleItem.route_points && sampleItem.route_points.length > 0) {
              console.log(`Sample route_point:`, JSON.stringify(sampleItem.route_points[0], null, 2));
            }
          }
          
          // Process items to get FIT files where available
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // Check if item has a FIT file URL or GPX file
            if (item.file?.url) {
              console.log(`Found file URL: ${item.file.url} for item: ${item.id}`);
              // Try to fetch FIT file data (if available)
              try {
                const fitFileRes = await fetch(item.file.url, {
                  headers: { "Authorization": `Bearer ${access_token}` },
                  signal: controller.signal,
                });
                
                if (fitFileRes.ok) {
                  // Check content type to determine if it's a FIT file
                  const contentType = fitFileRes.headers.get("content-type");
                  
                  if (contentType && 
                      (contentType.includes("application/octet-stream") || 
                       contentType.includes("application/fit") ||
                       contentType.includes("application/vnd.ant.fit"))) {
                    // Store the URL for later processing by the gpx-parser function
                    items[i] = {
                      ...items[i],
                      gpx_file_url: item.file.url,
                      file_type: "fit",
                      needs_gpx_processing: true
                    };
                    console.log(`Marked item ${item.id} for FIT file processing`);
                  }
                  // If it's possibly a GPX file
                  else if (contentType && 
                          (contentType.includes("application/gpx") || 
                           contentType.includes("text/xml") || 
                           contentType.includes("application/xml"))) {
                    items[i] = {
                      ...items[i],
                      gpx_file_url: item.file.url,
                      file_type: "gpx",
                      needs_gpx_processing: true
                    };
                    console.log(`Marked item ${item.id} for GPX file processing`);
                  }
                  // For other types just store the URL
                  else {
                    items[i] = {
                      ...items[i],
                      gpx_file_url: item.file.url,
                      file_type: "unknown",
                      needs_gpx_processing: true
                    };
                  }
                } else {
                  console.warn(`Could not fetch file at ${item.file.url}: ${fitFileRes.status}`);
                }
              } catch (fileErr) {
                console.warn(`Error fetching file at ${item.file.url}:`, fileErr);
                // Still store the URL even if fetch failed
                items[i] = {
                  ...items[i],
                  gpx_file_url: item.file.url,
                  needs_gpx_processing: true
                };
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
