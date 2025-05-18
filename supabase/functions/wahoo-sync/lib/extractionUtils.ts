
/**
 * Utilities for extracting values from objects
 */

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
