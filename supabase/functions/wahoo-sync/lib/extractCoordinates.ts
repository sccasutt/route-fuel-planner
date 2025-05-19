
/**
 * Utility functions for extracting GPS coordinates from various Wahoo data formats
 */

/**
 * Extract GPS coordinates from different possible sources in activity data
 */
export function extractCoordinates(activity: any): [number, number][] {
  let coordinates: [number, number][] = [];
  
  // Log the activity structure to help debug
  console.log(`Extracting coordinates from activity type: ${activity.type || 'unknown'}, has route_points: ${!!activity.route_points}, has trackpoints: ${!!activity.trackpoints}`);
  
  // Extract from route_points
  if (Array.isArray(activity.route_points)) {
    console.log(`Found ${activity.route_points.length} route_points in activity`);
    const points = activity.route_points
      .filter((point: any) => point.lat && point.lng)
      .map((point: any) => [point.lat, point.lng] as [number, number]);
    
    if (points.length > 0) {
      console.log(`Successfully extracted ${points.length} coordinates from route_points`);
      return points;
    }
  }
  
  // Extract from trackpoints
  if (Array.isArray(activity.trackpoints)) {
    console.log(`Found ${activity.trackpoints.length} trackpoints in activity`);
    const points = activity.trackpoints
      .filter((point: any) => {
        const hasCoords = (point.lat !== undefined && point.lon !== undefined) || 
                         (point.latitude !== undefined && point.longitude !== undefined);
        return hasCoords;
      })
      .map((point: any) => {
        const lat = point.lat !== undefined ? point.lat : point.latitude;
        const lng = point.lon !== undefined ? point.lon : point.longitude;
        return [lat, lng] as [number, number];
      });
    
    if (points.length > 0) {
      console.log(`Successfully extracted ${points.length} coordinates from trackpoints`);
      return points;
    }
  }
  
  // Extract from coordinates array
  if (Array.isArray(activity.coordinates)) {
    const coords = activity.coordinates
      .filter((coord: any) => Array.isArray(coord) && coord.length === 2)
      .map((coord: any) => [coord[0], coord[1]] as [number, number]);
    
    if (coords.length > 0) {
      console.log(`Successfully extracted ${coords.length} coordinates from coordinates array`);
      return coords;
    }
  }
  
  // Extract from latlng array
  if (Array.isArray(activity.latlng)) {
    const latlngs = activity.latlng
      .filter((coord: any) => Array.isArray(coord) && coord.length === 2)
      .map((coord: any) => [coord[0], coord[1]] as [number, number]);
    
    if (latlngs.length > 0) {
      console.log(`Successfully extracted ${latlngs.length} coordinates from latlng array`);
      return latlngs;
    }
  }
  
  // Extract from path
  if (Array.isArray(activity.path)) {
    const path = activity.path
      .filter((point: any) => point.lat && point.lng)
      .map((point: any) => [point.lat, point.lng] as [number, number]);
    
    if (path.length > 0) {
      console.log(`Successfully extracted ${path.length} coordinates from path array`);
      return path;
    }
  }
  
  // Extract from points
  if (Array.isArray(activity.points)) {
    const points = activity.points
      .filter((point: any) => (point.lat !== undefined && point.lng !== undefined) || 
                             (point.latitude !== undefined && point.longitude !== undefined))
      .map((point: any) => {
        const lat = point.lat !== undefined ? point.lat : point.latitude;
        const lng = point.lng !== undefined ? point.lng : point.longitude;
        return [lat, lng] as [number, number];
      });
    
    if (points.length > 0) {
      console.log(`Successfully extracted ${points.length} coordinates from points array`);
      return points;
    }
  }
  
  // Extract from track_points/track_data
  if (Array.isArray(activity.track_points) || Array.isArray(activity.track_data)) {
    const trackData = activity.track_points || activity.track_data;
    if (Array.isArray(trackData)) {
      try {
        const tracks = trackData
          .filter((point: any) => {
            return (point.lat !== undefined && point.lon !== undefined) || 
                   (point.latitude !== undefined && point.longitude !== undefined);
          })
          .map((point: any) => {
            const lat = point.lat !== undefined ? point.lat : point.latitude;
            const lng = point.lon !== undefined ? point.lon : point.longitude;
            return [lat, lng] as [number, number];
          });
        
        if (tracks.length > 0) {
          console.log(`Successfully extracted ${tracks.length} coordinates from track_points/track_data`);
          return tracks;
        }
      } catch (err) {
        console.error(`Error processing track points:`, err);
      }
    }
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
  
  console.log('No coordinates could be extracted from the activity');
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
