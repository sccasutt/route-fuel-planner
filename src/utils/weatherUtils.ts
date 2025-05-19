
import { supabase } from "@/integrations/supabase/client";

interface WindData {
  speed: number;
  direction: number;
  timestamp: string;
}

interface WeatherApiResponse {
  hourly: {
    time: string[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
  };
  latitude: number;
  longitude: number;
}

/**
 * Fetches historical wind data from Open-Meteo for a specific date and location
 */
export async function fetchWindData(
  latitude: number, 
  longitude: number, 
  date: string
): Promise<WindData[] | null> {
  try {
    if (!latitude || !longitude || !date) {
      console.error("Missing required parameters for wind data fetch");
      return null;
    }

    // Format date string (ensure YYYY-MM-DD format)
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${formattedDate}&end_date=${formattedDate}&hourly=wind_speed_10m,wind_direction_10m`;
    
    console.log(`Fetching wind data from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }
    
    const data: WeatherApiResponse = await response.json();
    
    // Transform API response into WindData array
    const windData: WindData[] = data.hourly.time.map((time, index) => ({
      timestamp: time,
      speed: data.hourly.wind_speed_10m[index],
      direction: data.hourly.wind_direction_10m[index],
    }));
    
    console.log(`Retrieved ${windData.length} wind data points for ${formattedDate}`);
    return windData;
  } catch (error) {
    console.error("Error fetching wind data:", error);
    return null;
  }
}

/**
 * Stores weather data in the routes table
 */
export async function storeWindData(
  routeId: string,
  windData: WindData[]
): Promise<boolean> {
  try {
    if (!routeId || !windData || windData.length === 0) {
      return false;
    }
    
    // Convert WindData array to a JSON-compatible format
    const windDataJson = windData.map(item => ({
      timestamp: item.timestamp,
      speed: item.speed,
      direction: item.direction
    }));
    
    const { error } = await supabase
      .from('routes')
      .update({
        weather_json: { wind_data: windDataJson }
      })
      .eq('id', routeId);
      
    if (error) {
      console.error("Error storing wind data:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error storing wind data:", error);
    return false;
  }
}

/**
 * Finds the nearest wind data point for a given timestamp
 */
export function findNearestWindData(
  windData: WindData[],
  timestamp: string
): WindData | null {
  if (!windData || windData.length === 0) {
    return null;
  }
  
  const targetTime = new Date(timestamp).getTime();
  
  // Find the nearest wind data point based on timestamp
  return windData.reduce((nearest, current) => {
    const nearestTime = new Date(nearest.timestamp).getTime();
    const currentTime = new Date(current.timestamp).getTime();
    
    const nearestDiff = Math.abs(nearestTime - targetTime);
    const currentDiff = Math.abs(currentTime - targetTime);
    
    return currentDiff < nearestDiff ? current : nearest;
  }, windData[0]);
}

/**
 * Analyze the impact of wind on a route 
 * @returns A summary string like "Moderate Headwind", "Light Tailwind", etc.
 */
export function getWindImpactSummary(weatherJson: any): string {
  if (!weatherJson || !weatherJson.wind_data || !weatherJson.wind_data.length) {
    return "Unknown";
  }
  
  // Calculate average wind speed and direction
  const windData = weatherJson.wind_data;
  const avgSpeed = windData.reduce((sum: number, data: WindData) => sum + data.speed, 0) / windData.length;
  
  // Categorize wind strength
  let strength = "No";
  if (avgSpeed > 1 && avgSpeed <= 5) strength = "Light";
  else if (avgSpeed > 5 && avgSpeed <= 10) strength = "Moderate";
  else if (avgSpeed > 10) strength = "Strong";
  
  // For simplicity, we'll assume the route direction is consistent
  // In a real implementation, you'd compare the route bearing to the wind direction
  // Here we just assume a headwind if wind is coming from northern directions
  const avgDirection = windData.reduce((sum: number, data: WindData) => sum + data.direction, 0) / windData.length;
  let type = "Wind";
  
  // Very simplified wind impact assessment (would need route direction in reality)
  if (avgDirection > 315 || avgDirection <= 45) type = "Headwind";
  else if (avgDirection > 135 && avgDirection <= 225) type = "Tailwind";
  else type = "Crosswind";
  
  return `${strength} ${type}`;
}
