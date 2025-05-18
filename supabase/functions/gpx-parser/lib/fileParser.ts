
import { extractCoordinatesFromGpx, extractDetailedPointsFromGpx } from './gpxParser.ts';

// Types for detailed point data
export interface DetailedPoint {
  lat: number;
  lng: number;
  elevation: number | null;
  timestamp: string | null;
}

// Helper function to extract coordinates and detailed points from various file formats
export async function extractCoordinatesFromFitFile(url: string): Promise<{
  coordinates: [number, number][];
  detailedPoints: DetailedPoint[];
}> {
  try {
    // For FIT files, we need to download the binary data and parse it
    console.log("Fetching file from URL:", url);
    
    const response = await fetch(url, {
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Wahoo-GPX-Parser/1.0'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    // Try to get the content as text first
    const content = await response.text();
    const coordinates: [number, number][] = [];
    let detailedPoints: DetailedPoint[] = [];
    
    console.log("Successfully fetched file content, content length:", content.length);
    console.log("Content starts with:", content.substring(0, 100));
    
    // If it looks like XML/GPX, parse it as such
    if (content.includes('<gpx') || content.includes('<trk') || content.includes('<wpt')) {
      console.log("Detected GPX format, extracting coordinates...");
      coordinates.push(...extractCoordinatesFromGpx(content));
      detailedPoints = extractDetailedPointsFromGpx(content);
      console.log(`Extracted ${coordinates.length} coordinates and ${detailedPoints.length} detailed points from GPX`);
      return { coordinates, detailedPoints };
    }
    
    // If it's JSON, try to parse it
    try {
      console.log("Trying to parse content as JSON...");
      const jsonData = JSON.parse(content);
      
      // Look for detailed points in various JSON formats
      if (jsonData.points && Array.isArray(jsonData.points)) {
        detailedPoints = jsonData.points.map((point: any, index: number) => {
          // Handle different JSON formats for points
          if (point.lat !== undefined && (point.lng !== undefined || point.lon !== undefined)) {
            return {
              lat: Number(point.lat),
              lng: Number(point.lng || point.lon),
              elevation: point.elevation !== undefined ? Number(point.elevation) : 
                        point.ele !== undefined ? Number(point.ele) : null,
              timestamp: point.timestamp || point.time || null
            };
          }
          // Handle array format [lat, lon, elevation?]
          if (Array.isArray(point) && point.length >= 2) {
            return {
              lat: Number(point[0]),
              lng: Number(point[1]),
              elevation: point.length > 2 ? Number(point[2]) : null,
              timestamp: null
            };
          }
          return null;
        }).filter(Boolean);
        console.log(`Found ${detailedPoints.length} detailed points in JSON format`);
      }
      
      // Also get simplified coordinates for map display
      if (jsonData.coordinates && Array.isArray(jsonData.coordinates)) {
        coordinates.push(...jsonData.coordinates.map((coord: any) => {
          if (Array.isArray(coord) && coord.length >= 2) {
            return [Number(coord[0]), Number(coord[1])] as [number, number];
          }
          return null;
        }).filter(Boolean));
        console.log(`Found ${coordinates.length} coordinates in JSON format`);
      } else if (detailedPoints.length > 0) {
        // Create simplified coordinates from detailed points if needed
        coordinates.push(...detailedPoints.map(p => [p.lat, p.lng] as [number, number]));
        console.log(`Created ${coordinates.length} coordinates from detailed points`);
      }
      
      return { coordinates, detailedPoints };
    } catch (e) {
      // Not JSON, continue to other formats
      console.log("Not JSON format:", e);
    }
    
    console.log("Could not parse file format, no coordinates extracted");
    return { coordinates: [], detailedPoints: [] };
  } catch (error) {
    console.error("Error extracting coordinates from file:", error);
    return { coordinates: [], detailedPoints: [] };
  }
}
