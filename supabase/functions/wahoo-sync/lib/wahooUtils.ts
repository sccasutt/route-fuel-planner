
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
 * Format duration string into consistent HH:MM:SS format
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
    const parts = duration.split(':');
    
    // Handle different formats
    if (parts.length === 1) {
      // Just numeric string, interpret as minutes
      const mins = parseInt(parts[0], 10);
      if (!isNaN(mins)) {
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}:00`;
      }
      return "0:00:00";
    } else if (parts.length === 2) {
      // MM:SS format, add hours
      return `0:${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    } else if (parts.length === 3) {
      // HH:MM:SS format, ensure padding
      return `${parts[0]}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
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
    // Format HH:MM:SS
    const timeMatch = duration.match(/^(\d+):(\d+):(\d+)$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = parseInt(timeMatch[3], 10);
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
