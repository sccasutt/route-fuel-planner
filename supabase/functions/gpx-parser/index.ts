
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

// Helper function to extract coordinates from Wahoo FIT files and other formats
async function extractCoordinatesFromFitFile(url: string): Promise<[number, number][]> {
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
    
    // If it looks like XML/GPX, parse it as such
    if (content.includes('<gpx') || content.includes('<trk') || content.includes('<wpt')) {
      return extractCoordinatesFromGpx(content);
    }
    
    // If it's JSON, try to parse it
    try {
      const jsonData = JSON.parse(content);
      
      // Look for coordinates in common formats
      if (jsonData.coordinates && Array.isArray(jsonData.coordinates)) {
        return jsonData.coordinates;
      }
      
      if (jsonData.points && Array.isArray(jsonData.points)) {
        return jsonData.points.map((point: any) => {
          if (Array.isArray(point) && point.length === 2) {
            return [Number(point[0]), Number(point[1])];
          }
          if (point.lat !== undefined && (point.lng !== undefined || point.lon !== undefined)) {
            return [Number(point.lat), Number(point.lng || point.lon)];
          }
          if (point.latitude !== undefined && point.longitude !== undefined) {
            return [Number(point.latitude), Number(point.longitude)];
          }
          return null;
        }).filter(Boolean) as [number, number][];
      }
      
      // If we have start coordinates in the JSON, use those as a fallback
      if (jsonData.start_lat !== undefined && jsonData.start_lng !== undefined) {
        return [[Number(jsonData.start_lat), Number(jsonData.start_lng)]];
      }
    } catch (e) {
      // Not JSON, continue to other formats
    }
    
    // For binary FIT files, we can only extract limited information
    // Here we'd normally use a FIT file parser, but for simplicity
    // we'll look for lat/lng patterns in the binary data
    
    console.log("Could not parse file format, no coordinates extracted");
    return [];
  } catch (error) {
    console.error("Error extracting coordinates from FIT file:", error);
    return [];
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
    const { gpx_url, file_url } = body;
    
    // Use either gpx_url or file_url (for Wahoo files)
    const url = gpx_url || file_url;
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'No URL provided' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log("Fetching file from URL:", url);
    
    // Set timeout to prevent infinite waiting
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    try {
      let coordinates: [number, number][] = [];
      
      // Check if it's a Wahoo FIT file or regular GPX
      if (url.includes('.fit') || url.includes('wahooligan.com')) {
        coordinates = await extractCoordinatesFromFitFile(url);
      } else {
        // Download the GPX file
        const response = await fetch(url, { 
          signal: controller.signal,
          headers: {
            'Accept': 'text/xml, application/xml, application/gpx+xml, */*',
            'User-Agent': 'Wahoo-GPX-Parser/1.0'
          }
        });
        
        if (!response.ok) {
          console.error(`Error fetching file: ${response.status} ${response.statusText}`);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to download file', 
              status: response.status,
              statusText: response.statusText
            }),
            { status: 502, headers: corsHeaders }
          );
        }
        
        // Get the content
        const content = await response.text();
        console.log("File content length:", content.length);
        
        if (content.length < 50) {
          console.error("File content too short, likely invalid");
          return new Response(
            JSON.stringify({ error: 'Invalid content (too short)' }),
            { status: 400, headers: corsHeaders }
          );
        }
        
        // Parse the content to extract coordinates
        coordinates = extractCoordinatesFromGpx(content);
      }
      
      clearTimeout(timeoutId);
      
      console.log(`Extracted ${coordinates.length} coordinates from file`);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          coordinates,
          source: 'file_url',
          coordinateCount: coordinates.length
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (fetchError) {
      console.error("Error fetching file:", fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Error fetching file', 
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
