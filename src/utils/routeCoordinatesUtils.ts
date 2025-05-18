
/**
 * Generate route coordinates based on activity data
 * @param index Route index for generating different shapes
 * @param activities List of activities
 * @param routeCoordinatesMap Map of existing route coordinates
 * @returns Array of [lat, lng] coordinates
 */
export function getRouteCoordinates(
  index: number,
  activities: any[],
  routeCoordinatesMap: Record<string, [number, number][]>
): [number, number][] {
  // Base center point
  const basePoint: [number, number] = [51.505, -0.09];
  
  // Default sample route coordinates
  const sampleRouteCoordinates: [number, number][] = [
    [51.505, -0.09],
    [51.51, -0.1],
    [51.52, -0.12],
    [51.518, -0.14],
    [51.51, -0.15],
    [51.5, -0.14],
    [51.495, -0.12],
    [51.505, -0.09],
  ];
  
  // If activity has coordinates in the map, use them
  if (activities[index % activities.length] && 
      routeCoordinatesMap[activities[index % activities.length].id]) {
    return routeCoordinatesMap[activities[index % activities.length].id];
  }
  
  // If activity has coordinates, try to use them
  if (activities[index % activities.length]?.coordinates && 
      Array.isArray(activities[index % activities.length].coordinates) && 
      activities[index % activities.length].coordinates!.length >= 2) {
    return activities[index % activities.length].coordinates as [number, number][];
  }
  
  // Different route shapes based on index
  switch (index % 3) {
    case 0: // circular
      return sampleRouteCoordinates;
    case 1: // out and back
      return [
        [basePoint[0], basePoint[1]],
        [basePoint[0] + 0.02, basePoint[1] + 0.02],
        [basePoint[0] + 0.04, basePoint[1] + 0.01],
        [basePoint[0] + 0.06, basePoint[1] + 0.03],
        [basePoint[0] + 0.06, basePoint[1] + 0.03], // turning point
        [basePoint[0] + 0.04, basePoint[1] + 0.01],
        [basePoint[0] + 0.02, basePoint[1] + 0.02],
        [basePoint[0], basePoint[1]],
      ];
    case 2: // triangle
      return [
        [basePoint[0], basePoint[1]],
        [basePoint[0] + 0.03, basePoint[1] + 0.05],
        [basePoint[0] - 0.03, basePoint[1] + 0.02],
        [basePoint[0], basePoint[1]],
      ];
    default:
      return sampleRouteCoordinates;
  }
}

/**
 * Check if activity has valid coordinates
 * @param routeCoordinates Route coordinates array
 * @returns Boolean indicating if coordinates are valid
 */
export function hasValidCoordinates(routeCoordinates: [number, number][] | undefined): boolean {
  return !!routeCoordinates && routeCoordinates.length >= 2;
}
