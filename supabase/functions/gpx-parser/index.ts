
// Edge function: Parses GPX and FIT files to extract GPS coordinates and stores them in the database

import { parseRequestJson } from '../wahoo-sync/lib/parseRequestJson.ts';
import { extractUserIdFromJwt } from '../wahoo-sync/lib/jwtHelpers.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

const isDev = Deno.env.get("ENVIRONMENT") === "development";

Deno.serve(async (req) => {
  if (isDev) {
    console.log("GPX Parser - Received request:", {
      method: req.method,
      url: req.url,
      hasAuthHeader: !!req.headers.get("authorization")
    });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth - Requires Auth Bearer header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(JSON.stringify({ 
        error: "Unauthorized", 
        details: "Missing or invalid authorization header" 
      }), { status: 401, headers: corsHeaders });
    }
    const jwt = authHeader.split(" ")[1];

    // Parse request body
    let body;
    try {
      body = await parseRequestJson(req);
      console.log("GPX Parser - Request body:", {
        hasRouteId: !!body.route_id,
        hasGpxFileUrl: !!body.gpx_file_url,
        fileType: body.file_type
      });
    } catch (err) {
      console.error("Error parsing request body:", err);
      return new Response(JSON.stringify({
        error: err.message || "Invalid request body",
        details: "Could not parse request JSON"
      }), { status: 400, headers: corsHeaders });
    }

    const { route_id, gpx_file_url, file_type } = body;

    if (!route_id || !gpx_file_url) {
      return new Response(JSON.stringify({
        error: "Missing required fields",
        details: "route_id and gpx_file_url are required"
      }), { status: 400, headers: corsHeaders });
    }

    // Extract user_id from JWT for security
    const userId = extractUserIdFromJwt(jwt);
    if (!userId) {
      console.error("Could not extract user ID from JWT");
      return new Response(JSON.stringify({ 
        error: "Invalid user JWT",
        details: "Could not extract user ID from JWT"
      }), { status: 401, headers: corsHeaders });
    }

    console.log(`GPX Parser - Processing file for route ${route_id}, user ${userId}`);
    console.log(`File URL: ${gpx_file_url}, Type: ${file_type}`);

    // Initialize Supabase client
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.0");
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the route belongs to the user
    const { data: routeData, error: routeError } = await client
      .from('routes')
      .select('id, user_id')
      .eq('id', route_id)
      .eq('user_id', userId)
      .single();

    if (routeError || !routeData) {
      console.error("Route not found or doesn't belong to user:", routeError);
      return new Response(JSON.stringify({
        error: "Route not found",
        details: "Route not found or access denied"
      }), { status: 404, headers: corsHeaders });
    }

    // Download the file
    console.log(`Downloading file from: ${gpx_file_url}`);
    let fileResponse;
    try {
      fileResponse = await fetch(gpx_file_url, {
        headers: {
          "User-Agent": "Wahoo-Route-Sync/1.0"
        }
      });

      if (!fileResponse.ok) {
        throw new Error(`Failed to download file: ${fileResponse.status} ${fileResponse.statusText}`);
      }
    } catch (downloadError) {
      console.error("Error downloading file:", downloadError);
      return new Response(JSON.stringify({
        error: "File download failed",
        details: downloadError.message
      }), { status: 502, headers: corsHeaders });
    }

    // Get file content
    const fileContent = await fileResponse.text();
    console.log(`Downloaded file, size: ${fileContent.length} characters`);

    // Parse coordinates based on file type
    let coordinates: [number, number][] = [];

    if (file_type === 'gpx' || gpx_file_url.toLowerCase().includes('.gpx')) {
      // Parse GPX file
      coordinates = parseGPXContent(fileContent);
    } else if (file_type === 'fit' || gpx_file_url.toLowerCase().includes('.fit')) {
      // For FIT files, we'd need a proper FIT parser
      // For now, return an error indicating FIT parsing is not yet implemented
      console.log("FIT file parsing not yet implemented");
      return new Response(JSON.stringify({
        error: "FIT file parsing not implemented",
        details: "FIT file parsing is not yet supported"
      }), { status: 501, headers: corsHeaders });
    } else {
      // Try to parse as GPX first, then give up
      coordinates = parseGPXContent(fileContent);
    }

    if (coordinates.length === 0) {
      console.log("No coordinates found in file");
      return new Response(JSON.stringify({
        error: "No coordinates found",
        details: "Could not extract coordinates from the file"
      }), { status: 400, headers: corsHeaders });
    }

    console.log(`Extracted ${coordinates.length} coordinates from file`);

    // Store coordinates in the routes table
    const { error: updateError } = await client
      .from('routes')
      .update({
        coordinates: coordinates,
        updated_at: new Date().toISOString()
      })
      .eq('id', route_id);

    if (updateError) {
      console.error("Error updating route with coordinates:", updateError);
      return new Response(JSON.stringify({
        error: "Database update failed",
        details: updateError.message
      }), { status: 500, headers: corsHeaders });
    }

    // Store individual route points
    const routePoints = coordinates.map((coord, index) => ({
      route_id: route_id,
      sequence_index: index,
      lat: coord[0],
      lng: coord[1],
      elevation: coord.length > 2 ? coord[2] : null
    }));

    // Delete existing points first
    await client
      .from('route_points')
      .delete()
      .eq('route_id', route_id);

    // Insert new points in batches
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < routePoints.length; i += batchSize) {
      const batch = routePoints.slice(i, i + batchSize);
      
      const { error: pointsError } = await client
        .from('route_points')
        .insert(batch);

      if (pointsError) {
        console.error(`Error inserting route points batch ${i/batchSize + 1}:`, pointsError);
      } else {
        insertedCount += batch.length;
      }
    }

    console.log(`GPX Parser - Successfully processed ${coordinates.length} coordinates and inserted ${insertedCount} route points for route ${route_id}`);

    return new Response(JSON.stringify({
      success: true,
      coordinates_count: coordinates.length,
      route_points_count: insertedCount
    }), { status: 200, headers: corsHeaders });

  } catch (err: any) {
    console.error("GPX Parser error:", err);
    return new Response(JSON.stringify({
      error: "Internal error",
      details: err.message || "Unknown error"
    }), { status: 500, headers: corsHeaders });
  }
});

/**
 * Parse GPX content to extract coordinates
 */
function parseGPXContent(content: string): [number, number][] {
  const coordinates: [number, number][] = [];
  
  try {
    // Simple regex-based GPX parsing
    // Look for <trkpt> elements with lat and lon attributes
    const trkptRegex = /<trkpt\s+lat=["']([^"']+)["']\s+lon=["']([^"']+)["'][^>]*>/g;
    let match;
    
    while ((match = trkptRegex.exec(content)) !== null) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      
      if (!isNaN(lat) && !isNaN(lon) && 
          lat >= -90 && lat <= 90 && 
          lon >= -180 && lon <= 180) {
        coordinates.push([lat, lon]);
      }
    }
    
    // If no track points found, try waypoints
    if (coordinates.length === 0) {
      const wptRegex = /<wpt\s+lat=["']([^"']+)["']\s+lon=["']([^"']+)["'][^>]*>/g;
      
      while ((match = wptRegex.exec(content)) !== null) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        
        if (!isNaN(lat) && !isNaN(lon) && 
            lat >= -90 && lat <= 90 && 
            lon >= -180 && lon <= 180) {
          coordinates.push([lat, lon]);
        }
      }
    }
    
    console.log(`Parsed ${coordinates.length} coordinates from GPX content`);
    
  } catch (parseError) {
    console.error("Error parsing GPX content:", parseError);
  }
  
  return coordinates;
}
