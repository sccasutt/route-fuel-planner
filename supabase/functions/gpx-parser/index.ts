// Edge function: Enhanced parser for GPX and FIT files to extract GPS coordinates and trackpoints

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

const isDev = Deno.env.get("ENVIRONMENT") === "development";

/**
 * Parse request JSON with error handling
 */
async function parseRequestJson(req: Request): Promise<any> {
  try {
    if ((req as any).bodyUsed) {
      console.error("Request body has already been read");
      throw new Error("Request body has already been read");
    }

    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn("Request content-type is not application/json:", contentType);
    }

    const text = await req.text();
    console.log("Request body raw length:", text ? text.length : 0);
    
    if (!text || text.trim() === '') {
      console.error("Empty request body received");
      throw new Error("Empty request body");
    }

    try {
      const parsedBody = JSON.parse(text);
      const safeKeys = Object.keys(parsedBody).filter(key => !key.includes('token'));
      console.log("JSON parsed successfully with keys:", safeKeys);
      return parsedBody;
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      throw new Error("Invalid JSON in request body");
    }
  } catch (err: any) {
    console.error("Error parsing request body:", err);
    throw {
      message: err.message || "Invalid request body",
      status: 400,
    };
  }
}

/**
 * Extract user ID from JWT token
 */
function extractUserIdFromJwt(jwt: string): string | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      console.error("Invalid JWT format - expected 3 parts");
      return null;
    }

    const payload = parts[1];
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    try {
      const decodedPayload = atob(paddedPayload);
      const parsedPayload = JSON.parse(decodedPayload);
      
      const userId = parsedPayload.sub;
      if (!userId) {
        console.error("No 'sub' field found in JWT payload");
        return null;
      }
      
      return userId;
    } catch (decodeError) {
      console.error("Error decoding JWT payload:", decodeError);
      return null;
    }
  } catch (err) {
    console.error("Error parsing JWT:", err);
    return null;
  }
}

/**
 * Parse FIT file and extract trackpoints (simplified version)
 */
function parseFitFile(buffer: ArrayBuffer): { coordinates: [number, number][], trackpoints: any[] } {
  console.log('Parsing FIT file, buffer size:', buffer.byteLength);
  
  const coordinates: [number, number][] = [];
  const trackpoints: any[] = [];
  
  try {
    const dataView = new DataView(buffer);
    
    // Basic FIT file validation
    if (buffer.byteLength < 14) {
      console.error('FIT file too small');
      return { coordinates, trackpoints };
    }
    
    // Check FIT signature
    const signature = new Uint8Array(buffer, 8, 4);
    const fitSignature = Array.from(signature).map(b => String.fromCharCode(b)).join('');
    
    if (fitSignature !== '.FIT') {
      console.error('Invalid FIT file signature:', fitSignature);
      return { coordinates, trackpoints };
    }
    
    console.log('FIT file validation passed');
    
    // Simple pattern matching for GPS coordinates
    // FIT coordinates are stored as semicircles (2^31 / 180 degrees)
    const semicirclesToDegrees = 180 / Math.pow(2, 31);
    
    // Search for GPS coordinate patterns in the file
    for (let i = 0; i < buffer.byteLength - 16; i += 4) {
      try {
        const lat32 = dataView.getInt32(i, true);
        const lng32 = dataView.getInt32(i + 4, true);
        
        if (lat32 !== 0 && lng32 !== 0 && lat32 !== -1 && lng32 !== -1) {
          const lat = lat32 * semicirclesToDegrees;
          const lng = lng32 * semicirclesToDegrees;
          
          // Validate coordinates are reasonable
          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            coordinates.push([lat, lng]);
            
            // Try to extract additional data from nearby bytes
            const trackpoint: any = {
              lat,
              lng,
              sequence_index: trackpoints.length
            };
            
            // Try to extract elevation (uint16, scaled)
            try {
              const elevRaw = dataView.getUint16(i + 8, true);
              if (elevRaw && elevRaw !== 0xFFFF && elevRaw < 10000) {
                trackpoint.elevation = (elevRaw / 5) - 500;
              }
            } catch (e) {}
            
            // Try to extract power (uint16)
            try {
              const powerRaw = dataView.getUint16(i + 12, true);
              if (powerRaw && powerRaw !== 0xFFFF && powerRaw < 2000) {
                trackpoint.power = powerRaw;
              }
            } catch (e) {}
            
            trackpoints.push(trackpoint);
          }
        }
      } catch (e) {
        // Continue searching if this offset doesn't contain valid data
      }
    }
    
    console.log(`Extracted ${coordinates.length} coordinates and ${trackpoints.length} trackpoints from FIT file`);
    
  } catch (error) {
    console.error('Error parsing FIT file:', error);
  }
  
  return { coordinates, trackpoints };
}

Deno.serve(async (req) => {
  if (isDev) {
    console.log("Enhanced GPX/FIT Parser - Received request:", {
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
      console.log("Enhanced Parser - Request body:", {
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

    console.log(`Enhanced Parser - Processing file for route ${route_id}, user ${userId}`);
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

    // Parse coordinates and trackpoints based on file type
    let coordinates: [number, number][] = [];
    let trackpoints: any[] = [];

    if (file_type === 'fit' || gpx_file_url.toLowerCase().includes('.fit')) {
      // Parse FIT file
      const fileBuffer = await fileResponse.arrayBuffer();
      const fitResult = parseFitFile(fileBuffer);
      coordinates = fitResult.coordinates;
      trackpoints = fitResult.trackpoints;
    } else {
      // Parse GPX file
      const fileContent = await fileResponse.text();
      coordinates = parseGPXContent(fileContent);
    }

    if (coordinates.length === 0) {
      console.log("No coordinates found in file");
      return new Response(JSON.stringify({
        error: "No coordinates found",
        details: "Could not extract coordinates from the file"
      }), { status: 400, headers: corsHeaders });
    }

    console.log(`Extracted ${coordinates.length} coordinates and ${trackpoints.length} trackpoints from file`);

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

    // Store trackpoints if we have them
    let storedTrackpoints = 0;
    if (trackpoints.length > 0) {
      const trackpointRecords = trackpoints.map(tp => ({
        route_id: route_id,
        lat: tp.lat,
        lon: tp.lng,
        elevation: tp.elevation || null,
        power: tp.power || null,
        heart_rate: tp.heart_rate || null,
        cadence: tp.cadence || null
      }));

      // Insert trackpoints in batches
      const batchSize = 100;
      for (let i = 0; i < trackpointRecords.length; i += batchSize) {
        const batch = trackpointRecords.slice(i, i + batchSize);
        
        const { error: trackpointsError } = await client
          .from('trackpoints')
          .insert(batch);

        if (trackpointsError) {
          console.error(`Error inserting trackpoints batch ${i/batchSize + 1}:`, trackpointsError);
        } else {
          storedTrackpoints += batch.length;
        }
      }
    }

    console.log(`Enhanced Parser - Successfully processed ${coordinates.length} coordinates and ${storedTrackpoints} trackpoints for route ${route_id}`);

    return new Response(JSON.stringify({
      success: true,
      coordinates_count: coordinates.length,
      trackpoints_count: storedTrackpoints,
      file_type: file_type
    }), { status: 200, headers: corsHeaders });

  } catch (err: any) {
    console.error("Enhanced Parser error:", err);
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
