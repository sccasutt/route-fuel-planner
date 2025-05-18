
/**
 * Utility functions for extracting GPS coordinates from various Wahoo data formats
 */

/**
 * Extract GPS coordinates from different possible sources in activity data
 */
export function extractCoordinates(activity: any): [number, number][] {
  let coordinates: [number, number][] = [];
  
  // Extract from route_points
  if (Array.isArray(activity.route_points)) {
    const points = activity.route_points
      .filter((point: any) => point.lat && point.lng)
      .map((point: any) => [point.lat, point.lng] as [number, number]);
    
    if (points.length > 0) {
      return points;
    }
  }
  
  // Extract from coordinates array
  if (Array.isArray(activity.coordinates)) {
    const coords = activity.coordinates
      .filter((coord: any) => Array.isArray(coord) && coord.length === 2)
      .map((coord: any) => [coord[0], coord[1]] as [number, number]);
    
    if (coords.length > 0) {
      return coords;
    }
  }
  
  // Extract from latlng array
  if (Array.isArray(activity.latlng)) {
    const latlngs = activity.latlng
      .filter((coord: any) => Array.isArray(coord) && coord.length === 2)
      .map((coord: any) => [coord[0], coord[1]] as [number, number]);
    
    if (latlngs.length > 0) {
      return latlngs;
    }
  }
  
  // Extract from path
  if (Array.isArray(activity.path)) {
    const path = activity.path
      .filter((point: any) => point.lat && point.lng)
      .map((point: any) => [point.lat, point.lng] as [number, number]);
    
    if (path.length > 0) {
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
          return tracks;
        }
      } catch (err) {
        console.error(`Error processing track points:`, err);
      }
    }
  }
  
  return coordinates;
}

/**
 * Create standardized GPX data object for storage
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
