
// Edge function: Fetches Wahoo user profile and recent routes and stores them in the database
// Updated to follow Wahoo API documentation workflow

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

    // Parse request body with better error handling
    let body;
    try {
      body = await parseRequestJson(req);
      if (isDev) {
        console.log("Request body parsed successfully:", {
          hasAccessToken: !!body.access_token,
          hasRefreshToken: !!body.refresh_token,
          hasWahooUserId: !!body.wahoo_user_id,
          hasUserId: !!body.user_id
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

    const { access_token, refresh_token, wahoo_user_id, user_id: clientProvidedUserId } = body;

    // Extract user_id from JWT and use it as the primary identifier
    const jwtUserId = extractUserIdFromJwt(jwt);
    if (!jwtUserId) {
      console.error("Could not extract user ID from JWT");
      return new Response(JSON.stringify({ 
        error: "Invalid user JWT",
        details: "Could not extract user ID from JWT"
      }), { status: 401, headers: corsHeaders });
    }

    // For security, ensure we use the JWT user_id, not the client-provided one
    const user_id = jwtUserId;
    if (user_id !== clientProvidedUserId) {
      console.warn("Client-provided user ID doesn't match JWT user ID. Using JWT user ID for security.");
    }

    console.log("Starting Wahoo data fetching for user:", user_id, "Wahoo user ID:", wahoo_user_id || "not provided");

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

    // Fetch Wahoo activities (recent rides) with proper source endpoint tracking
    let activities;
    try {
      activities = await fetchWahooActivities(access_token);
      
      // Add source endpoint info to each activity
      if (Array.isArray(activities)) {
        activities = activities.map(activity => ({
          ...activity,
          _sourceEndpoint: "wahoo-api"
        }));
        
        // Log sample trackpoints for debugging
        if (activities.length > 0) {
          const sampleActivity = activities[0];
          if (sampleActivity.trackpoints && Array.isArray(sampleActivity.trackpoints)) {
            console.log(`Sample activity has ${sampleActivity.trackpoints.length} trackpoints`);
            if (sampleActivity.trackpoints.length > 0) {
              console.log('First trackpoint sample:', JSON.stringify(sampleActivity.trackpoints[0]));
            }
          } else {
            console.log('First activity has no trackpoints array');
          }
        }
      }
    } catch (err: any) {
      console.error("Wahoo activities fetch failed:", err.message);
      return new Response(JSON.stringify({
        error: err.message || "Failed to fetch Wahoo activities",
        details: err.details || "Wahoo API error",
        status: err.httpStatus || 502
      }), { status: err.status || 502, headers: corsHeaders });
    }

    // Insert/update profile and upsert routes
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.0");
      const client = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // First check if trackpoints table exists, if not, display an error
      const { error: tableCheckError } = await client
        .from('trackpoints')
        .select('route_id')
        .limit(1);

      if (tableCheckError) {
        console.error('CRITICAL ERROR: The trackpoints table does not exist or is inaccessible:', tableCheckError.message);
        console.error('Please create the trackpoints table in your Supabase database first!');
        
        // We'll continue with the sync but warn the user
      }

      await upsertWahooProfile(client, user_id, wahooProfileId, profile);
      const routeCount = await upsertRoutes(client, user_id, activities);

      console.log("Sync operation completed successfully for user:", user_id);
      return new Response(
        JSON.stringify({
          ok: true,
          profile,
          routeCount,
          activityCount: activities.length
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
    console.error("wahoo-sync error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal error",
        details: err.message || "Unknown error"
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
