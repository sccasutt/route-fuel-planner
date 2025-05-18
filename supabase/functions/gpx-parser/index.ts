
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

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const { gpx_url } = await req.json();
    
    if (!gpx_url) {
      return new Response(
        JSON.stringify({ error: 'No GPX URL provided' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log("Fetching GPX from URL:", gpx_url);
    
    // Set timeout to prevent infinite waiting
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      // Download the GPX file
      const response = await fetch(gpx_url, { 
        signal: controller.signal,
        headers: {
          // Some common headers to help with downloads
          'Accept': 'text/xml, application/xml, application/gpx+xml, */*',
          'User-Agent': 'Wahoo-GPX-Parser/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Error fetching GPX: ${response.status} ${response.statusText}`);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to download GPX file', 
            status: response.status,
            statusText: response.statusText
          }),
          { status: 502, headers: corsHeaders }
        );
      }
      
      // Get the content
      const gpxContent = await response.text();
      console.log("GPX content length:", gpxContent.length);
      
      if (gpxContent.length < 50) {
        console.error("GPX content too short, likely invalid");
        return new Response(
          JSON.stringify({ error: 'Invalid GPX content (too short)' }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Parse the GPX content to extract coordinates
      const coordinates = extractCoordinatesFromGpx(gpxContent);
      
      console.log(`Extracted ${coordinates.length} coordinates from GPX file`);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          coordinates,
          source: 'gpx_url',
          coordinateCount: coordinates.length
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (fetchError) {
      console.error("Error fetching GPX file:", fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Error fetching GPX file', 
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
