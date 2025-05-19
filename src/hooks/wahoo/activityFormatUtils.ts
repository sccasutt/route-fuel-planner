
import { RouteType } from "@/types/route";
import { WahooActivityData } from "./wahooTypes";

/**
 * Convert raw database route data to typed WahooActivityData
 */
export function processActivityData(raw: any): WahooActivityData {
  if (!raw) {
    throw new Error("Cannot process undefined or null activity data");
  }
  
  // Handle both direct coordinates and gpx_data parsing
  let coordinates: [number, number][] = [];
  
  // First check if coordinates are available directly
  if (raw.coordinates) {
    try {
      if (typeof raw.coordinates === 'string') {
        coordinates = JSON.parse(raw.coordinates);
      } else if (Array.isArray(raw.coordinates)) {
        // Make sure each coordinate is a valid [lat, lng] tuple
        coordinates = raw.coordinates
          .filter((coord: any) => 
            Array.isArray(coord) && coord.length >= 2 && 
            typeof coord[0] === 'number' && typeof coord[1] === 'number'
          )
          .map((coord: any) => [coord[0], coord[1]]);
      }
    } catch (e) {
      console.error("Error parsing coordinates:", e);
      coordinates = [];
    }
  }
  
  // If no coordinates and there's gpx_data available, try to parse it
  if (coordinates.length === 0 && raw.gpx_data) {
    try {
      let gpxObj;
      if (typeof raw.gpx_data === 'string') {
        gpxObj = JSON.parse(raw.gpx_data);
      } else {
        gpxObj = raw.gpx_data;
      }
      
      if (gpxObj && gpxObj.coordinates && Array.isArray(gpxObj.coordinates)) {
        coordinates = gpxObj.coordinates;
      }
    } catch (e) {
      console.error("Error parsing gpx_data:", e);
    }
  }
  
  // Process metadata
  let metadata = {};
  if (raw.metadata) {
    try {
      if (typeof raw.metadata === 'string') {
        metadata = JSON.parse(raw.metadata);
      } else {
        metadata = raw.metadata;
      }
    } catch (e) {
      console.error("Error parsing metadata:", e);
    }
  }
  
  // Extract weather data if available
  let weather = null;
  if (raw.route_weather && raw.route_weather.length > 0) {
    const weatherData = raw.route_weather[0];
    weather = {
      temperature: weatherData.temperature,
      conditions: weatherData.conditions,
      windSpeed: weatherData.wind_speed,
      humidity: weatherData.humidity
    };
  }
  
  // Ensure proper typing for numeric fields
  const activity: WahooActivityData = {
    id: raw.id || "",
    wahoo_route_id: raw.wahoo_route_id || raw.id || "",
    name: raw.name || "Unnamed Activity",
    date: raw.date || new Date().toISOString(),
    distance: typeof raw.distance === "number" ? raw.distance : 
              typeof raw.distance === "string" ? parseFloat(raw.distance) : 0,
    elevation: typeof raw.elevation === "number" ? raw.elevation :
               typeof raw.elevation === "string" ? parseFloat(raw.elevation) : 0,
    duration: raw.duration || "0:00:00",
    duration_seconds: raw.duration_seconds || 0,
    calories: typeof raw.calories === "number" ? raw.calories :
              typeof raw.calories === "string" ? parseInt(raw.calories, 10) : 0,
    type: raw.type || "activity",
    coordinates: coordinates,
    weatherData: weather,
    metadata: metadata,
    gpx_file_url: raw.gpx_file_url || null,
    start_lat: raw.start_lat || null,
    start_lng: raw.start_lng || null,
  };
  
  return activity;
}

/**
 * Format duration in human readable format
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format distance in human readable format
 */
export function formatDistance(meters: number): string {
  if (!meters || isNaN(meters)) return "0 m";
  
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  
  return `${Math.round(meters)} m`;
}
