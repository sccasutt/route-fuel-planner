
/**
 * Utility functions for extracting GPS coordinates from various Wahoo data formats
 */

/**
 * Extract GPS coordinates from different possible sources in activity data
 */
export function extractCoordinates(activity: any): [number, number][] {
  let coordinates: [number, number][] = [];
  
  // Log the activity structure to help debug
  console.log(`Extracting coordinates from activity ID: ${activity.id || activity.wahoo_id || 'unknown'}`);
  console.log(`Activity type: ${activity.type || 'unknown'}, has route_points: ${!!activity.route_points}, has trackpoints: ${!!activity.trackpoints}`);
  
  // PRIORITY 1: Extract from trackpoints (most detailed data)
  if (Array.isArray(activity.trackpoints) && activity.trackpoints.length > 0) {
    console.log(`Found ${activity.trackpoints.length} trackpoints in activity`);
    const points = activity.trackpoints
      .filter((point: any) => {
        const hasLat = point.lat !== undefined || point.latitude !== undefined;
        const hasLng = point.lng !== undefined || point.lon !== undefined || point.longitude !== undefined;
        return hasLat && hasLng;
      })
      .map((point: any) => {
        const lat = point.lat !== undefined ? point.lat : point.latitude;
        const lng = point.lng !== undefined ? point.lng : 
                   point.lon !== undefined ? point.lon : point.longitude;
        return [parseFloat(lat), parseFloat(lng)] as [number, number];
      })
      .filter((coord: [number, number]) => 
        !isNaN(coord[0]) && !isNaN(coord[1]) && 
        coord[0] >= -90 && coord[0] <= 90 && 
        coord[1] >= -180 && coord[1] <= 180
      );
    
    if (points.length > 0) {
      console.log(`Successfully extracted ${points.length} coordinates from trackpoints`);
      console.log(`First coordinate: [${points[0][0]}, ${points[0][1]}]`);
      console.log(`Last coordinate: [${points[points.length-1][0]}, ${points[points.length-1][1]}]`);
      return points;
    }
  }
  
  // PRIORITY 2: Extract from route_points
  if (Array.isArray(activity.route_points) && activity.route_points.length > 0) {
    console.log(`Found ${activity.route_points.length} route_points in activity`);
    const points = activity.route_points
      .filter((point: any) => {
        const hasLat = point.lat !== undefined || point.latitude !== undefined;
        const hasLng = point.lng !== undefined || point.lon !== undefined || point.longitude !== undefined;
        return hasLat && hasLng;
      })
      .map((point: any) => {
        const lat = point.lat !== undefined ? point.lat : point.latitude;
        const lng = point.lng !== undefined ? point.lng : 
                   point.lon !== undefined ? point.lon : point.longitude;
        return [parseFloat(lat), parseFloat(lng)] as [number, number];
      })
      .filter((coord: [number, number]) => 
        !isNaN(coord[0]) && !isNaN(coord[1]) && 
        coord[0] >= -90 && coord[0] <= 90 && 
        coord[1] >= -180 && coord[1] <= 180
      );
    
    if (points.length > 0) {
      console.log(`Successfully extracted ${points.length} coordinates from route_points`);
      console.log(`First coordinate: [${points[0][0]}, ${points[0][1]}]`);
      return points;
    }
  }
  
  // PRIORITY 3: Extract from coordinates array
  if (Array.isArray(activity.coordinates) && activity.coordinates.length > 0) {
    console.log(`Found ${activity.coordinates.length} coordinates in activity.coordinates`);
    const coords = activity.coordinates
      .filter((coord: any) => Array.isArray(coord) && coord.length >= 2)
      .map((coord: any) => [parseFloat(coord[0]), parseFloat(coord[1])] as [number, number])
      .filter((coord: [number, number]) => 
        !isNaN(coord[0]) && !isNaN(coord[1]) && 
        coord[0] >= -90 && coord[0] <= 90 && 
        coord[1] >= -180 && coord[1] <= 180
      );
    
    if (coords.length > 0) {
      console.log(`Successfully extracted ${coords.length} coordinates from coordinates array`);
      console.log(`First coordinate: [${coords[0][0]}, ${coords[0][1]}]`);
      return coords;
    }
  }
  
  // PRIORITY 4: Extract from latlng array
  if (Array.isArray(activity.latlng) && activity.latlng.length > 0) {
    console.log(`Found ${activity.latlng.length} latlng coordinates`);
    const latlngs = activity.latlng
      .filter((coord: any) => Array.isArray(coord) && coord.length >= 2)
      .map((coord: any) => [parseFloat(coord[0]), parseFloat(coord[1])] as [number, number])
      .filter((coord: [number, number]) => 
        !isNaN(coord[0]) && !isNaN(coord[1]) && 
        coord[0] >= -90 && coord[0] <= 90 && 
        coord[1] >= -180 && coord[1] <= 180
      );
    
    if (latlngs.length > 0) {
      console.log(`Successfully extracted ${latlngs.length} coordinates from latlng array`);
      console.log(`First coordinate: [${latlngs[0][0]}, ${latlngs[0][1]}]`);
      return latlngs;
    }
  }
  
  // PRIORITY 5: Extract from path
  if (Array.isArray(activity.path) && activity.path.length > 0) {
    console.log(`Found ${activity.path.length} path points`);
    const path = activity.path
      .filter((point: any) => {
        const hasLat = point.lat !== undefined || point.latitude !== undefined;
        const hasLng = point.lng !== undefined || point.lon !== undefined || point.longitude !== undefined;
        return hasLat && hasLng;
      })
      .map((point: any) => {
        const lat = point.lat !== undefined ? point.lat : point.latitude;
        const lng = point.lng !== undefined ? point.lng : 
                   point.lon !== undefined ? point.lon : point.longitude;
        return [parseFloat(lat), parseFloat(lng)] as [number, number];
      })
      .filter((coord: [number, number]) => 
        !isNaN(coord[0]) && !isNaN(coord[1]) && 
        coord[0] >= -90 && coord[0] <= 90 && 
        coord[1] >= -180 && coord[1] <= 180
      );
    
    if (path.length > 0) {
      console.log(`Successfully extracted ${path.length} coordinates from path array`);
      console.log(`First coordinate: [${path[0][0]}, ${path[0][1]}]`);
      return path;
    }
  }
  
  // PRIORITY 6: Extract from waypoints
  if (Array.isArray(activity.waypoints) && activity.waypoints.length > 0) {
    console.log(`Found ${activity.waypoints.length} waypoints`);
    const waypoints = activity.waypoints
      .filter((point: any) => {
        const hasLat = point.lat !== undefined || point.latitude !== undefined;
        const hasLng = point.lng !== undefined || point.lon !== undefined || point.longitude !== undefined;
        return hasLat && hasLng;
      })
      .map((point: any) => {
        const lat = point.lat !== undefined ? point.lat : point.latitude;
        const lng = point.lng !== undefined ? point.lng : 
                   point.lon !== undefined ? point.lon : point.longitude;
        return [parseFloat(lat), parseFloat(lng)] as [number, number];
      })
      .filter((coord: [number, number]) => 
        !isNaN(coord[0]) && !isNaN(coord[1]) && 
        coord[0] >= -90 && coord[0] <= 90 && 
        coord[1] >= -180 && coord[1] <= 180
      );
    
    if (waypoints.length > 0) {
      console.log(`Successfully extracted ${waypoints.length} coordinates from waypoints`);
      console.log(`First coordinate: [${waypoints[0][0]}, ${waypoints[0][1]}]`);
      return waypoints;
    }
  }
  
  // PRIORITY 7: Extract from points
  if (Array.isArray(activity.points) && activity.points.length > 0) {
    console.log(`Found ${activity.points.length} points`);
    const points = activity.points
      .filter((point: any) => {
        const hasLat = point.lat !== undefined || point.latitude !== undefined;
        const hasLng = point.lng !== undefined || point.lon !== undefined || point.longitude !== undefined;
        return hasLat && hasLng;
      })
      .map((point: any) => {
        const lat = point.lat !== undefined ? point.lat : point.latitude;
        const lng = point.lng !== undefined ? point.lng : 
                   point.lon !== undefined ? point.lon : point.longitude;
        return [parseFloat(lat), parseFloat(lng)] as [number, number];
      })
      .filter((coord: [number, number]) => 
        !isNaN(coord[0]) && !isNaN(coord[1]) && 
        coord[0] >= -90 && coord[0] <= 90 && 
        coord[1] >= -180 && coord[1] <= 180
      );
    
    if (points.length > 0) {
      console.log(`Successfully extracted ${points.length} coordinates from points array`);
      console.log(`First coordinate: [${points[0][0]}, ${points[0][1]}]`);
      return points;
    }
  }
  
  // PRIORITY 8: Extract from track_points/track_data
  if (Array.isArray(activity.track_points) || Array.isArray(activity.track_data)) {
    const trackData = activity.track_points || activity.track_data;
    console.log(`Found ${trackData.length} track_points/track_data`);
    if (Array.isArray(trackData)) {
      try {
        const tracks = trackData
          .filter((point: any) => {
            const hasLat = point.lat !== undefined || point.latitude !== undefined;
            const hasLng = point.lng !== undefined || point.lon !== undefined || point.longitude !== undefined;
            return hasLat && hasLng;
          })
          .map((point: any) => {
            const lat = point.lat !== undefined ? point.lat : point.latitude;
            const lng = point.lng !== undefined ? point.lng : 
                       point.lon !== undefined ? point.lon : point.longitude;
            return [parseFloat(lat), parseFloat(lng)] as [number, number];
          })
          .filter((coord: [number, number]) => 
            !isNaN(coord[0]) && !isNaN(coord[1]) && 
            coord[0] >= -90 && coord[0] <= 90 && 
            coord[1] >= -180 && coord[1] <= 180
          );
        
        if (tracks.length > 0) {
          console.log(`Successfully extracted ${tracks.length} coordinates from track_points/track_data`);
          console.log(`First coordinate: [${tracks[0][0]}, ${tracks[0][1]}]`);
          return tracks;
        }
      } catch (err) {
        console.error(`Error processing track points:`, err);
      }
    }
  }
  
  // Check if this activity needs GPX file processing
  if (activity.needs_gpx_processing && activity.gpx_file_url) {
    console.log(`Activity has GPX file URL but no extracted coordinates - GPX processing required: ${activity.gpx_file_url}`);
  }
  
  // Try to extract from fit_file or raw data if present
  if (activity.fit_file || activity.raw_data || activity.fit_data) {
    console.log('Activity contains fit_file or raw_data, attempting to extract coordinates');
    try {
      // This would require a proper FIT file parser
      // For now just log that we found this data format
      console.log('FIT data format found but needs specialized parser');
    } catch (err) {
      console.error('Error extracting from FIT data:', err);
    }
  }
  
  console.log(`No coordinates could be extracted from activity ${activity.id || activity.wahoo_id || 'unknown'}`);
  return coordinates;
}

/**
 * Create standardized GPX data object for storage
 * Enhanced to better preserve detailed point data
 */
export function createGpxDataObject(coordinates: [number, number][], rawGpxData: any): string | null {
  if (coordinates.length > 0) {
    return JSON.stringify({ 
      coordinates,
      raw_gpx: rawGpxData  // Store the raw GPX data if available
    });
  } else if (rawGpxData) {
    try {
      // Check if raw data is already JSON
      const parsed = typeof rawGpxData === 'string' ? JSON.parse(rawGpxData) : rawGpxData;
      return JSON.stringify({
        coordinates: parsed.coordinates || [],
        raw_gpx: rawGpxData
      });
    } catch (e) {
      // If not JSON, store as raw string but in our container format
      return JSON.stringify({
        coordinates: [],
        raw_gpx: rawGpxData
      });
    }
  }
  
  return null;
}

/**
 * Extract detailed trackpoints from various activity data formats
 * This provides more complete data than just coordinates
 */
export function extractTrackpoints(activity: any): any[] {
  let trackpoints: any[] = [];
  
  // Function to normalize a trackpoint object
  const normalizeTrackpoint = (point: any, index: number) => {
    // Extract lat/lon with fallbacks
    const lat = point.lat !== undefined ? point.lat : 
                point.latitude !== undefined ? point.latitude : null;
    
    const lng = point.lon !== undefined ? point.lon : 
                point.lng !== undefined ? point.lng : 
                point.longitude !== undefined ? point.longitude : null;
    
    // Only include points with valid coordinates
    if (lat === null || lng === null) return null;
    
    // Normalize elevation with fallbacks
    const elevation = point.elevation !== undefined ? point.elevation : 
                      point.ele !== undefined ? point.ele : 
                      point.alt !== undefined ? point.alt : 
                      point.altitude !== undefined ? point.altitude : null;
    
    // Normalize timestamp with fallbacks
    const timestamp = point.time || point.timestamp || point.recorded_at || null;
    
    // Normalize power data
    const power = point.power || point.watts || null;
    
    // Normalize heart rate data
    const heartRate = point.heart_rate || point.hr || point.heartrate || null;
    
    // Normalize cadence
    const cadence = point.cadence || point.rpm || null;
    
    // Return normalized trackpoint
    return {
      lat,
      lng,
      elevation,
      timestamp,
      power,
      heart_rate: heartRate,
      cadence,
      sequence_index: index
    };
  };
  
  // Try different possible trackpoint data structures
  if (Array.isArray(activity.trackpoints)) {
    console.log(`Processing ${activity.trackpoints.length} trackpoints from activity.trackpoints`);
    trackpoints = activity.trackpoints
      .map((point, idx) => normalizeTrackpoint(point, idx))
      .filter(point => point !== null);
  } 
  else if (Array.isArray(activity.track_points)) {
    console.log(`Processing ${activity.track_points.length} trackpoints from activity.track_points`);
    trackpoints = activity.track_points
      .map((point, idx) => normalizeTrackpoint(point, idx))
      .filter(point => point !== null);
  }
  else if (Array.isArray(activity.points)) {
    console.log(`Processing ${activity.points.length} trackpoints from activity.points`);
    trackpoints = activity.points
      .map((point, idx) => normalizeTrackpoint(point, idx))
      .filter(point => point !== null);
  }
  else if (Array.isArray(activity.route_points)) {
    console.log(`Processing ${activity.route_points.length} trackpoints from activity.route_points`);
    trackpoints = activity.route_points
      .map((point, idx) => normalizeTrackpoint(point, idx))
      .filter(point => point !== null);
  }
  
  console.log(`Successfully extracted ${trackpoints.length} detailed trackpoints`);
  return trackpoints;
}
