
// Utility functions for processing Wahoo data

/**
 * Safely extracts a value from a nested object using multiple possible paths
 */
export const extractNestedValue = (obj: any, paths: string[]): any => {
  if (!obj || typeof obj !== 'object') return undefined;
  
  for (const path of paths) {
    // Handle dot notation for nested properties
    if (path.includes('.')) {
      const parts = path.split('.');
      let value = obj;
      
      for (const part of parts) {
        if (value === undefined || value === null) break;
        value = value[part];
      }
      
      if (value !== undefined && value !== null) return value;
    } 
    // Direct property access
    else if (obj[path] !== undefined && obj[path] !== null) {
      return obj[path];
    }
  }
  
  return undefined;
};

/**
 * Format duration string to consistent HH:MM:SS format
 */
export const formatDurationString = (duration: string): string => {
  if (!duration) return "0:00:00";
  
  // If already in HH:MM:SS format, return as is
  if (/^\d+:\d{2}:\d{2}$/.test(duration)) return duration;
  
  // Try to parse various formats
  let seconds = durationToSeconds(duration);
  
  // Format as HH:MM:SS
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Convert duration string or value to seconds
 */
export const durationToSeconds = (duration: string | number): number => {
  if (typeof duration === 'number') return duration;
  if (!duration) return 0;
  
  // Check if in HH:MM:SS format
  const hhmmss = duration.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);
  if (hhmmss) {
    return parseInt(hhmmss[1]) * 3600 + parseInt(hhmmss[2]) * 60 + parseInt(hhmmss[3]);
  }
  
  // Check if in MM:SS format
  const mmss = duration.match(/^(\d+):(\d{1,2})$/);
  if (mmss) {
    return parseInt(mmss[1]) * 60 + parseInt(mmss[2]);
  }
  
  // Check if it has "hr", "min", "sec" notation
  let seconds = 0;
  const hourMatch = duration.match(/(\d+)\s*h(r|our|rs|ours)?/i);
  const minMatch = duration.match(/(\d+)\s*m(in|inute|ins|inutes)?/i);
  const secMatch = duration.match(/(\d+)\s*s(ec|econd|ecs|econds)?/i);
  
  if (hourMatch) seconds += parseInt(hourMatch[1]) * 3600;
  if (minMatch) seconds += parseInt(minMatch[1]) * 60;
  if (secMatch) seconds += parseInt(secMatch[1]);
  
  // If nothing matched but it's just a number, assume it's seconds
  if (seconds === 0 && /^\d+(\.\d+)?$/.test(duration)) {
    seconds = parseFloat(duration);
  }
  
  return seconds;
};

/**
 * Parse numeric value safely with default
 */
export const parseNumericValue = (value: any, defaultValue = 0): number => {
  if (value === undefined || value === null) return defaultValue;
  
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string') {
    const parsedValue = parseFloat(value);
    return !isNaN(parsedValue) ? parsedValue : defaultValue;
  }
  
  return defaultValue;
};
