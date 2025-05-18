
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from './lib/corsUtils.ts';
import { extractCoordinatesFromFitFile } from './lib/fileParser.ts';
import { storeRoutePoints } from './lib/databaseUtils.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const body = await req.json();
    const { gpx_url, file_url, route_id, wahoo_route_id } = body;
    
    // Use either gpx_url or file_url (for Wahoo files)
    const url = gpx_url || file_url;
    
    if (!url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No URL provided',
          message: 'No GPX or file URL was provided' 
        }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (!route_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No route_id provided',
          message: 'Route ID is required to extract data' 
        }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`Processing route [${route_id}] with file: ${url}`);
    console.log(`Wahoo route ID (if available): ${wahoo_route_id || 'not provided'}`);
    
    // Set timeout to prevent infinite waiting
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout
    
    try {
      // Extract coordinates and detailed points from the file
      console.log("Extracting coordinates and detailed points from file...");
      const { coordinates, detailedPoints } = await extractCoordinatesFromFitFile(url);
      
      clearTimeout(timeoutId);
      
      console.log(`Extracted ${coordinates.length} coordinates and ${detailedPoints.length} detailed points from file`);
      
      // Create Supabase client to store the detailed points
      console.log("Creating Supabase client...");
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      
      // Store the detailed points in the route_points table
      let pointsInserted = 0;
      if (detailedPoints.length > 0) {
        console.log(`Storing ${detailedPoints.length} detailed points for route ${route_id}...`);
        pointsInserted = await storeRoutePoints(supabaseClient, route_id, detailedPoints);
        console.log(`Successfully stored ${pointsInserted} points in the database`);
      } else {
        console.log("No detailed points found to store");
      }
      
      // Also update the coordinates field in the routes table for quick access
      if (coordinates.length > 0) {
        console.log("Updating route coordinates in routes table...");
        const { error: updateError } = await supabaseClient
          .from('routes')
          .update({ coordinates })
          .eq('id', route_id);
          
        if (updateError) {
          console.error("Error updating route coordinates:", updateError);
        } else {
          console.log("Successfully updated route coordinates");
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          coordinates,
          source: 'file_url',
          coordinateCount: coordinates.length,
          pointsInserted,
          message: pointsInserted > 0 
            ? `Successfully extracted ${pointsInserted} route points` 
            : "No route points could be extracted"
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (fetchError) {
      console.error("Error fetching or processing file:", fetchError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Error fetching or processing file', 
          details: fetchError.message || String(fetchError)
        }),
        { status: 502, headers: corsHeaders }
      );
    }
  } catch (err) {
    console.error("Error processing request:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Server error', 
        details: err.message || String(err) 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
