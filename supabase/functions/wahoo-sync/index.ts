
// Edge function: Enhanced Wahoo sync with detailed trackpoint data and calorie calculations
// Updated to fetch detailed workout data and properly store GPS coordinates

import { parseRequestJson } from './lib/parseRequestJson.ts';
import { parseJwt, extractUserIdFromJwt } from './lib/jwtHelpers.ts';
import { fetchWahooProfile, fetchWahooActivities } from './lib/wahooApi.ts';
import { upsertWahooProfile, upsertRoutes } from './lib/upsertHelpers.ts';
import { validateRequestBody } from './lib/validateRequestBody.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

const isDev = Deno.env.get("ENVIRONMENT") === "development";

Deno.serve(async (req) => {
  if (isDev) {
    console.log("=== ENHANCED WAHOO SYNC START ===");
    console.log("Received request:", {
      method: req.method,
      url: req.url,
      hasAuthHeader: !!req.headers.get("authorization"),
      contentType: req.headers.get("content-type"),
      contentLength: req.headers.get("content-length")
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

    // Extract user_id from JWT as the primary identifier
    const jwtUserId = extractUserIdFromJwt(jwt);
    if (!jwtUserId) {
      console.error("Could not extract user ID from JWT");
      return new Response(JSON.stringify({ 
        error: "Invalid user JWT",
        details: "Could not extract user ID from JWT"
      }), { status: 401, headers: corsHeaders });
    }

    // Parse request body with better error handling
    let body;
    try {
      body = await parseRequestJson(req);
      if (isDev) {
        console.log("Request body parsed successfully:", {
          hasAccessToken: !!body.access_token,
          hasRefreshToken: !!body.refresh_token,
          hasWahooUserId: !!body.wahoo_user_id,
          receivedFields: Object.keys(body)
        });
      }
    } catch (err) {
      console.error("Error parsing request body:", err);
      return new Response(JSON.stringify({
        error: err.message || "Invalid request body",
        details: "Could not parse request JSON",
        status: 400
      }), { status: err.status || 400, headers: corsHeaders });
    }

    // Validate request body fields
    const validationResult = validateRequestBody(body);
    if (!validationResult.valid) {
      console.error("Request validation failed:", validationResult.error);
      return new Response(JSON.stringify({
        error: "Invalid request data",
        details: validationResult.error,
        status: 400
      }), { status: 400, headers: corsHeaders });
    }

    const { access_token, refresh_token, wahoo_user_id } = body;

    // Use JWT user_id as the authoritative user identifier
    const user_id = jwtUserId;

    console.log("=== STARTING ENHANCED WAHOO DATA SYNC ===");
    console.log("User:", user_id, "Wahoo user ID:", wahoo_user_id || "not provided");

    // Fetch Wahoo profile
    let profile;
    try {
      profile = await fetchWahooProfile(access_token);
    } catch (err: any) {
      console.error("Wahoo profile fetch failed:", err.message);
      return new Response(JSON.stringify({
        error: err.message || "Failed to fetch Wahoo profile",
        details: err.details || "Wahoo API error",
        status: err.httpStatus || 502
      }), { status: err.status || 502, headers: corsHeaders });
    }

    // Get the Wahoo user ID from the profile response if not provided in token
    const wahooProfileId = wahoo_user_id || profile.id;
    if (!wahooProfileId) {
      console.error("Could not determine Wahoo user ID from token or profile");
      return new Response(JSON.stringify({
        error: "Could not determine Wahoo user ID",
        details: "Neither token nor profile contained a Wahoo user ID"
      }), { status: 500, headers: corsHeaders });
    }

    // Fetch Wahoo activities with ENHANCED detailed data extraction
    let activities;
    try {
      console.log("=== FETCHING ENHANCED WAHOO ACTIVITIES ===");
      activities = await fetchWahooActivities(access_token);
      
      console.log("=== ACTIVITIES FETCH SUMMARY ===");
      console.log(`Total activities fetched: ${activities.length}`);
      
      // Add source tracking and access token for FIT file processing
      if (Array.isArray(activities)) {
        activities = activities.map(activity => ({
          ...activity,
          _sourceEndpoint: "wahoo-api-enhanced",
          _syncTimestamp: new Date().toISOString(),
          _access_token: access_token // Add access token for FIT file downloads
        }));
      }
    } catch (err: any) {
      console.error("Enhanced Wahoo activities fetch failed:", err.message);
      return new Response(JSON.stringify({
        error: err.message || "Failed to fetch Wahoo activities",
        details: err.details || "Wahoo API error",
        status: err.httpStatus || 502
      }), { status: err.status || 502, headers: corsHeaders });
    }

    // Process and store data
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.0");
      const client = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Check database connectivity
      const { error: tableCheckError } = await client
        .from('trackpoints')
        .select('route_id')
        .limit(1);

      if (tableCheckError) {
        console.error('CRITICAL ERROR: The trackpoints table does not exist or is inaccessible:', tableCheckError.message);
        console.error('Please create the trackpoints table in your Supabase database first!');
      }

      console.log("=== STORING PROFILE AND ROUTES WITH ACCESS TOKEN ===");
      await upsertWahooProfile(client, user_id, wahooProfileId, profile);
      
      // Pass access token directly to upsertRoutes instead of setting environment variable
      const routeCount = await upsertRoutes(client, user_id, activities, access_token);
      
      console.log("=== ENHANCED SYNC OPERATION COMPLETED ===");
      console.log(`User: ${user_id}`);
      console.log(`Routes processed: ${routeCount}`);
      console.log(`Activities fetched: ${activities.length}`);
      
      return new Response(
        JSON.stringify({
          ok: true,
          profile,
          routeCount,
          activityCount: activities.length,
          enhanced: true,
          syncTimestamp: new Date().toISOString()
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err: any) {
      console.error("Database operation error:", err);
      return new Response(
        JSON.stringify({
          error: "Database operation failed",
          details: err.message || "Unknown database error"
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (err: any) {
    console.error("Enhanced wahoo-sync error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal error",
        details: err.message || "Unknown error"
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
