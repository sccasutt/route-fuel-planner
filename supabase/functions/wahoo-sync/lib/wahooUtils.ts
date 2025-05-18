
// Utility functions for Wahoo API integration

/**
 * Extracts nested values from an object with fallback paths
 */
export const extractNestedValue = (obj: any, paths: string[]): any => {
  if (!obj) return null;
  
  for (const path of paths) {
    const parts = path.split('.');
    let value = obj;
    let foundPath = true;
    
    for (const part of parts) {
      if (value && value[part] !== undefined) {
        value = value[part];
      } else {
        foundPath = false;
        break;
      }
    }
    
    if (foundPath && value !== undefined && value !== null) {
      return value;
    }
  }
  return null;
};

/**
 * Format duration string into consistent H:MM:SS format (no leading zero for hours)
 */
export function formatDurationString(duration: string | number): string {
  if (!duration) return "0:00:00";
  
  // If duration is a number, assume it's in seconds
  if (typeof duration === 'number') {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Handle string durations
  if (typeof duration === 'string') {
    // Handle human-readable formats like "2h 30m 15s"
    if (duration.includes('h') || duration.includes('m') || duration.includes('s')) {
      const hoursMatch = duration.match(/(\d+)h/);
      const minutesMatch = duration.match(/(\d+)m/);
      const secondsMatch = duration.match(/(\d+)s/);
      
      const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
      const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
      const seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;
      
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Check if already in H:MM:SS format
    const timeFormat = duration.match(/^(\d+):(\d+):(\d+)$/);
    if (timeFormat) {
      const hours = parseInt(timeFormat[1], 10);
      const minutes = parseInt(timeFormat[2], 10);
      const seconds = parseInt(timeFormat[3], 10);
      
      // Ensure we use the H:MM:SS format (no leading zero for hours)
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    const parts = duration.split(':');
    
    // Handle different formats
    if (parts.length === 1) {
      // Just numeric string, interpret as seconds
      const seconds = parseInt(parts[0], 10);
      if (!isNaN(seconds)) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return "0:00:00";
    } else if (parts.length === 2) {
      // MM:SS format, add hours
      return `0:${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }
  
  return "0:00:00";
}

/**
 * Convert duration string to seconds
 */
export function durationToSeconds(duration: string | number): number {
  if (!duration) return 60; // Default to 1 minute (60 seconds)
  
  // If already a number, assume it's already in seconds
  if (typeof duration === 'number') {
    return duration > 0 ? duration : 60;
  }
  
  // Handle string durations in various formats
  if (typeof duration === 'string') {
    // Check if it's already in H:MM:SS format
    const timeFormat = duration.match(/^(\d+):(\d+):(\d+)$/);
    if (timeFormat) {
      const hours = parseInt(timeFormat[1], 10);
      const minutes = parseInt(timeFormat[2], 10);
      const seconds = parseInt(timeFormat[3], 10);
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    // Handle human-readable formats like "2h 30m 15s"
    if (duration.includes('h') || duration.includes('m') || duration.includes('s')) {
      const hoursMatch = duration.match(/(\d+)h/);
      const minutesMatch = duration.match(/(\d+)m/);
      const secondsMatch = duration.match(/(\d+)s/);
      
      const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
      const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
      const seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;
      
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    // Format MM:SS
    const mmssMatch = duration.match(/^(\d+):(\d+)$/);
    if (mmssMatch) {
      const minutes = parseInt(mmssMatch[1], 10);
      const seconds = parseInt(mmssMatch[2], 10);
      return minutes * 60 + seconds;
    }
    
    // Format "Xh Ym"
    const hourMinMatch = duration.match(/^(\d+)h\s*(\d+)m$/);
    if (hourMinMatch) {
      const hours = parseInt(hourMinMatch[1], 10);
      const minutes = parseInt(hourMinMatch[2], 10);
      return hours * 3600 + minutes * 60;
    }
    
    // Format "Ym Xs"
    const minSecMatch = duration.match(/^(\d+)m\s*(\d+)s$/);
    if (minSecMatch) {
      const minutes = parseInt(minSecMatch[1], 10);
      const seconds = parseInt(minSecMatch[2], 10);
      return minutes * 60 + seconds;
    }
    
    // Format just seconds "Xs"
    const secMatch = duration.match(/^(\d+)s$/);
    if (secMatch) {
      return parseInt(secMatch[1], 10);
    }
    
    // Try parsing as a plain number in string form
    const numericValue = parseFloat(duration);
    if (!isNaN(numericValue)) {
      return numericValue > 0 ? numericValue : 60;
    }
  }
  
  return 60; // Default to 1 minute (60 seconds)
}

/**
 * Improved function to parse numeric values safely
 */
export function parseNumericValue(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  
  if (typeof value === 'number') {
    return !isNaN(value) ? value : defaultValue;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) ? parsed : defaultValue;
  }
  
  return defaultValue;
}
