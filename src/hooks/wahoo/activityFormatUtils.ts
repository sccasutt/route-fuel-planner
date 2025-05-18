
import { WahooActivityData } from "./wahooTypes";

/**
 * Processes a raw database route into a typed WahooActivityData object
 */
export function processActivityData(route: any): WahooActivityData {
  // Extract GPS coordinates from gpx_data if available
  let coordinates: [number, number][] = [];
  let rawGpxData = route.gpx_data;
  let rawGpx: any = null;

  if (rawGpxData) {
    try {
      // Parse JSON data if it's a string
      const gpxData = typeof rawGpxData === 'string' ? JSON.parse(rawGpxData) : rawGpxData;
      
      // Store raw GPX data separately if available
      if (gpxData.raw_gpx) {
        rawGpx = gpxData.raw_gpx;
      }
      
      // Get coordinates from parsed data
      if (gpxData && gpxData.coordinates && Array.isArray(gpxData.coordinates)) {
        coordinates = gpxData.coordinates
          .filter((coord: any) => {
            // Handle different coordinate formats
            if (Array.isArray(coord) && coord.length >= 2) {
              return typeof coord[0] === 'number' && typeof coord[1] === 'number';
            } else if (typeof coord === 'object' && coord !== null) {
              const lat = coord.lat !== undefined ? coord.lat : coord.latitude;
              const lng = coord.lng !== undefined ? coord.lng : 
                        (coord.lon !== undefined ? coord.lon : coord.longitude);
              
              return lat !== undefined && lng !== undefined;
            }
            return false;
          })
          .map((coord: any) => {
            // Convert to [number, number] format
            if (Array.isArray(coord) && coord.length >= 2) {
              // Direct [lat, lng] format
              return [coord[0], coord[1]] as [number, number];
            } else if (typeof coord === 'object' && coord !== null) {
              // Object with lat/lng or latitude/longitude properties
              const lat = coord.lat !== undefined ? coord.lat : coord.latitude;
              const lng = coord.lng !== undefined ? coord.lng : 
                        (coord.lon !== undefined ? coord.lon : coord.longitude);
              
              return [lat, lng] as [number, number];
            }
            return null;
          }).filter(Boolean) as [number, number][];
      }
      
      console.log(`Extracted ${coordinates.length} coordinates for route ${route.id}`);
    } catch (err) {
      console.warn("Failed to parse gpx_data:", err);
      coordinates = [];
    }
  }

  // Extract route metadata if available
  let metadata = {};
  if (route.metadata) {
    try {
      metadata = typeof route.metadata === 'string' ? 
        JSON.parse(route.metadata) : route.metadata;
    } catch (err) {
      console.warn("Failed to parse route metadata:", err);
    }
  }

  // Process weather data if available
  let weather = null;
  if (route.route_weather && route.route_weather.length > 0) {
    weather = route.route_weather[0];
  }

  // Format the route data into our standard WahooActivityData structure
  return {
    id: route.id,
    wahooRouteId: route.wahoo_route_id,
    name: route.name || "Unnamed Route",
    date: route.date || new Date().toISOString(), 
    distance: typeof route.distance === 'number' ? route.distance : 0,
    elevation: typeof route.elevation === 'number' ? route.elevation : 0,
    duration: route.duration || "0:00:00",
    duration_seconds: route.duration_seconds || 0,
    calories: route.calories || 0,
    coordinates,
    gpx_data: rawGpxData,
    raw_gpx: rawGpx,  // Store the raw GPX separately if available
    gpx_file_url: route.gpx_file_url || null,
    type: route.type || "activity",
    weather,
    metadata
  };
}
