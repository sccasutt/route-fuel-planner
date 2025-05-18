
/**
 * Helper functions for parsing and validating GPS coordinates
 */

/**
 * Parse a coordinates array into a typed array of [lat, lng] tuples
 * @param input The coordinates array to parse
 * @returns Typed array of [lat, lng] coordinates
 */
export function parseCoordinatesArray(input: any): [number, number][] {
  try {
    if (!Array.isArray(input)) {
      return [];
    }
    
    return input
      .filter((coord: any) => 
        Array.isArray(coord) && 
        coord.length === 2 &&
        !isNaN(Number(coord[0])) && 
        !isNaN(Number(coord[1]))
      )
      .map((coord: any) => [Number(coord[0]), Number(coord[1])] as [number, number]);
  } catch (e) {
    console.error("Error parsing coordinates:", e);
    return [];
  }
}

/**
 * Generate default/fallback coordinates for when no valid data exists
 * @returns Array of [lat, lng] coordinates in a simple route shape
 */
export function getFallbackCoordinates(): [number, number][] {
  return [
    [51.505, -0.09],
    [51.51, -0.1],
    [51.52, -0.12],
    [51.518, -0.14],
    [51.51, -0.15],
    [51.5, -0.14],
    [51.495, -0.12],
    [51.505, -0.09],
  ];
}
