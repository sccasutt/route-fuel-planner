
/**
 * Utility functions for formatting Wahoo activity data
 */

import { WahooActivityData } from "./wahooTypes";

/**
 * Converts seconds to HH:MM:SS format string
 */
export function secondsToTimeString(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:01:00"; // Default to 1 minute if no valid value
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats duration string consistently to HH:MM:SS format
 */
export function formatDurationString(duration: string): string {
  if (!duration) return "0:00:00";
  
  // Handle different formats
  if (duration.includes('h') || duration.includes('m') || duration.includes('s')) {
    // Format like "2h 30m 15s"
    const hoursMatch = duration.match(/(\d+)h/);
    const minutesMatch = duration.match(/(\d+)m/);
    const secondsMatch = duration.match(/(\d+)s/);
    
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
    const seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Make sure the duration is in HH:MM:SS format
  const parts = duration.split(':');
  if (parts.length === 1) {
    // Just seconds
    const seconds = parseInt(parts[0], 10) || 0;
    if (seconds === 0) {
      // Default to 1 minute if duration is zero
      return "0:01:00";
    }
    return `0:00:${parts[0].padStart(2, '0')}`;
  } else if (parts.length === 2) {
    return `0:${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  } else if (parts.length === 3) {
    return `${parts[0]}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
  }
  
  return "0:01:00"; // Default to 1 minute
}

/**
 * Converts string duration to seconds
 */
export function durationToSeconds(duration: string): number {
  if (!duration) return 60; // Default to 1 minute
  
  // Handle different formats
  if (duration.includes('h') || duration.includes('m') || duration.includes('s')) {
    // Format like "2h 30m 15s"
    const hoursMatch = duration.match(/(\d+)h/);
    const minutesMatch = duration.match(/(\d+)m/);
    const secondsMatch = duration.match(/(\d+)s/);
    
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
    const seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  const parts = duration.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0], 10) * 3600 + 
           parseInt(parts[1], 10) * 60 + 
           parseInt(parts[2], 10);
  } else if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  } else if (parts.length === 1) {
    const seconds = parseInt(parts[0], 10);
    return seconds > 0 ? seconds : 60;
  }
  
  return 60; // Default to 1 minute
}

/**
 * Sanitizes numeric values to ensure they are valid numbers
 */
export function sanitizeNumericValue(value: any, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  } else if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
}

/**
 * Processes and standardizes raw activity data into WahooActivityData format
 */
export function processActivityData(rawActivity: any): WahooActivityData {
  // Handle ID
  const id = rawActivity.id || 
             rawActivity.wahoo_route_id || 
             `route-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Handle name
  const name = rawActivity.name || "Unnamed Activity";
  
  // Format date
  let dateStr = rawActivity.date;
  if (dateStr) {
    try {
      // Try to parse as ISO date
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
        dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
      }
    } catch (e) {
      console.error("Error parsing date:", e);
      dateStr = new Date().toISOString().split('T')[0];
    }
  } else {
    dateStr = new Date().toISOString().split('T')[0];
  }
  
  // Handle numeric values
  const distance = sanitizeNumericValue(rawActivity.distance);
  const elevation = sanitizeNumericValue(rawActivity.elevation);
  const calories = sanitizeNumericValue(rawActivity.calories, 0);
  
  // Handle duration with preference for duration_seconds
  let durationSeconds = rawActivity.duration_seconds;
  let duration;
  
  if (typeof durationSeconds === 'number' && durationSeconds > 0) {
    // We have seconds, convert to HH:MM:SS
    duration = secondsToTimeString(durationSeconds);
  } else {
    // Fall back to text-based duration with validation
    if (rawActivity.duration === null || rawActivity.duration === undefined) {
      duration = "0:01:00"; // Default 1 minute
      durationSeconds = 60;
    } else if (rawActivity.duration === "0" || rawActivity.duration === "0s" || rawActivity.duration === "0:00:00" || rawActivity.duration === 0) {
      duration = "0:01:00"; // Use 1 minute instead of zero
      durationSeconds = 60;
    } else if (typeof rawActivity.duration === 'string') {
      // Format consistently to HH:MM:SS
      duration = formatDurationString(rawActivity.duration);
      durationSeconds = durationToSeconds(duration);
    } else if (typeof rawActivity.duration === 'number') {
      // Convert seconds to HH:MM:SS
      if (rawActivity.duration <= 0) {
        duration = "0:01:00"; // Use 1 minute instead of zero
        durationSeconds = 60;
      } else {
        durationSeconds = rawActivity.duration;
        duration = secondsToTimeString(durationSeconds);
      }
    } else {
      duration = "0:01:00"; // Default 1 minute
      durationSeconds = 60;
    }
  }
  
  // Ensure duration_seconds is never zero or negative
  if (durationSeconds <= 0) {
    durationSeconds = 60;
    duration = "0:01:00";
  }
  
  return {
    id,
    name,
    date: dateStr,
    distance,
    elevation,
    duration,
    duration_seconds: durationSeconds,
    calories,
    gpx_data: rawActivity.gpx_data || null
  };
}
