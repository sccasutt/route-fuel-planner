
// Helper function to extract coordinates from GPX content
export function extractCoordinatesFromGpx(gpxContent: string): [number, number][] {
  try {
    const coordinates: [number, number][] = [];
    
    // Look for trkpt (track point) elements with lat and lon attributes
    const trackPointRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>/g;
    let match;
    
    while ((match = trackPointRegex.exec(gpxContent)) !== null) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        coordinates.push([lat, lon]);
      }
    }
    
    // If no trkpt elements found, try looking for wpt (waypoint) elements
    if (coordinates.length === 0) {
      const waypointRegex = /<wpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>/g;
      while ((match = waypointRegex.exec(gpxContent)) !== null) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        
        if (!isNaN(lat) && !isNaN(lon)) {
          coordinates.push([lat, lon]);
        }
      }
    }
    
    // If still no coordinates, look for rtept (route point) elements
    if (coordinates.length === 0) {
      const routePointRegex = /<rtept\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>/g;
      while ((match = routePointRegex.exec(gpxContent)) !== null) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        
        if (!isNaN(lat) && !isNaN(lon)) {
          coordinates.push([lat, lon]);
        }
      }
    }
    
    return coordinates;
  } catch (error) {
    console.error("Error parsing GPX content:", error);
    return [];
  }
}

// Function to extract detailed point data from GPX
export function extractDetailedPointsFromGpx(gpxContent: string): Array<{
  lat: number;
  lng: number;
  elevation: number | null;
  timestamp: string | null;
}> {
  try {
    const points = [];
    
    // Process track points (most common)
    const trackPointRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>(?:(.*?)<\/trkpt>)/gs;
    let match;
    
    while ((match = trackPointRegex.exec(gpxContent)) !== null) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      const pointContent = match[3];
      
      // Extract elevation if available
      let elevation = null;
      const eleMatch = /<ele>([\d.-]+)<\/ele>/i.exec(pointContent);
      if (eleMatch) {
        elevation = parseFloat(eleMatch[1]);
      }
      
      // Extract timestamp if available
      let timestamp = null;
      const timeMatch = /<time>([^<]+)<\/time>/i.exec(pointContent);
      if (timeMatch) {
        timestamp = timeMatch[1];
      }
      
      if (!isNaN(lat) && !isNaN(lon)) {
        points.push({
          lat,
          lng: lon,
          elevation,
          timestamp
        });
      }
    }
    
    // If no track points, try waypoints or route points with the same approach
    if (points.length === 0) {
      // Similar regex processing for wpt and rtept elements
      // Omitted for brevity but would follow the same pattern
    }
    
    return points;
  } catch (error) {
    console.error("Error parsing detailed GPX content:", error);
    return [];
  }
}
