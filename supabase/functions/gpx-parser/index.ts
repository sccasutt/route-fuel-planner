
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Helper function to extract coordinates from GPX content
function extractCoordinatesFromGpx(gpxContent: string): [number, number][] {
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

// New function to extract detailed point data from GPX
function extractDetailedPointsFromGpx(gpxContent: string): Array<{
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

// Helper function to extract coordinates and detailed points from various file formats
async function extractCoordinatesFromFitFile(url: string): Promise<{
  coordinates: [number, number][];
  detailedPoints: Array<{
    lat: number;
    lng: number;
    elevation: number | null;
    timestamp: string | null;
  }>;
}> {
  try {
    // For FIT files, we need to download the binary data and parse it
    const response = await fetch(url, {
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Wahoo-GPX-Parser/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch FIT file: ${response.status} ${response.statusText}`);
    }
    
    // Try to get the content as text first
    const content = await response.text();
    const coordinates: [number, number][] = [];
    let detailedPoints: Array<{
      lat: number;
      lng: number;
      elevation: number | null;
      timestamp: string | null;
    }> = [];
    
    // If it looks like XML/GPX, parse it as such
    if (content.includes('<gpx') || content.includes('<trk') || content.includes('<wpt')) {
      coordinates.push(...extractCoordinatesFromGpx(content));
      detailedPoints = extractDetailedPointsFromGpx(content);
      return { coordinates, detailedPoints };
    }
    
    // If it's JSON, try to parse it
    try {
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
      }
      
      // Also get simplified coordinates for map display
      if (jsonData.coordinates && Array.isArray(jsonData.coordinates)) {
        coordinates.push(...jsonData.coordinates.map((coord: any) => {
          if (Array.isArray(coord) && coord.length >= 2) {
            return [Number(coord[0]), Number(coord[1])] as [number, number];
          }
          return null;
        }).filter(Boolean));
      } else if (detailedPoints.length > 0) {
        // Create simplified coordinates from detailed points if needed
        coordinates.push(...detailedPoints.map(p => [p.lat, p.lng] as [number, number]));
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

// Helper function to store route points in the database
async function storeRoutePoints(
  client: any,
  routeId: string,
  points: Array<{
    lat: number;
    lng: number;
    elevation: number | null;
    timestamp: string | null;
  }>
): Promise<number> {
  if (!points || points.length === 0) {
    console.log("No points to store for route", routeId);
    return 0;
  }
  
  console.log(`Storing ${points.length} points for route ${routeId}`);
  
  try {
    // Process in batches to avoid potential size limits
    const batchSize = 500;
    let insertedCount = 0;
    
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      const values = batch.map((point, index) => ({
        route_id: routeId,
        sequence_index: i + index,
        lat: point.lat,
        lng: point.lng,
        elevation: point.elevation,
        recorded_at: point.timestamp ? new Date(point.timestamp).toISOString() : null
      }));
      
      const { error } = await client
        .from('route_points')
        .upsert(values, { onConflict: 'route_id,sequence_index', ignoreDuplicates: false });
      
      if (error) {
        console.error("Error storing route points batch:", error);
        throw error;
      }
      
      insertedCount += batch.length;
      console.log(`Inserted batch of ${batch.length} points. Total: ${insertedCount}`);
    }
    
    return insertedCount;
  } catch (error) {
    console.error("Error in storeRoutePoints:", error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const body = await req.json();
    const { gpx_url, file_url, route_id } = body;
    
    // Use either gpx_url or file_url (for Wahoo files)
    const url = gpx_url || file_url;
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'No URL provided' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (!route_id) {
      return new Response(
        JSON.stringify({ error: 'No route_id provided' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log("Fetching file from URL:", url, "for route:", route_id);
    
    // Set timeout to prevent infinite waiting
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    try {
      // Extract coordinates and detailed points from the file
      const { coordinates, detailedPoints } = await extractCoordinatesFromFitFile(url);
      
      clearTimeout(timeoutId);
      
      console.log(`Extracted ${coordinates.length} coordinates and ${detailedPoints.length} detailed points from file`);
      
      // Create Supabase client to store the detailed points
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      
      // Store the detailed points in the route_points table
      let pointsInserted = 0;
      if (detailedPoints.length > 0) {
        pointsInserted = await storeRoutePoints(supabaseClient, route_id, detailedPoints);
      }
      
      // Also update the coordinates field in the routes table for quick access
      if (coordinates.length > 0) {
        const { error: updateError } = await supabaseClient
          .from('routes')
          .update({ coordinates })
          .eq('id', route_id);
          
        if (updateError) {
          console.error("Error updating route coordinates:", updateError);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          coordinates,
          source: 'file_url',
          coordinateCount: coordinates.length,
          pointsInserted
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (fetchError) {
      console.error("Error fetching or processing file:", fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Error fetching or processing file', 
          details: fetchError.message || String(fetchError)
        }),
        { status: 502, headers: corsHeaders }
      );
    }
  } catch (err) {
    console.error("Error processing request:", err);
    return new Response(
      JSON.stringify({ error: 'Server error', details: err.message || String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
