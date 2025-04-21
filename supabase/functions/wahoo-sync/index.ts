
// Edge function: Fetches Wahoo user profile and recent routes and stores them in the database

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch { return {}; }
}

async function parseRequestJson(req) {
  try {
    const text = await req.text();
    if (!text || text.trim() === '') {
      throw new Error("Empty request body");
    }
    
    console.log("Request body content length:", text.length);
    try {
      return JSON.parse(text);
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      throw new Error("Invalid JSON in request body");
    }
  } catch (err) {
    console.error("Error parsing request body:", err);
    throw {
      message: err.message || "Invalid request body",
      status: 400
    };
  }
}

function extractUserIdFromJwt(jwt) {
  const payload = parseJwt(jwt);
  return payload.sub;
}

async function fetchWahooProfile(access_token) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    console.log("Fetching Wahoo profile with access token...");
    const profileRes = await fetch("https://api.wahooligan.com/v1/user", {
      headers: { "Authorization": `Bearer ${access_token}`, "Accept": "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!profileRes.ok) {
      const errorText = await profileRes.text();
      console.error("Failed to fetch Wahoo profile:", profileRes.status, errorText);
      throw {
        message: "Failed to fetch Wahoo profile",
        status: 502,
        details: errorText,
        httpStatus: profileRes.status
      };
    }
    
    const profile = await profileRes.json();
    console.log("Successfully fetched Wahoo profile with ID:", profile.id);
    return profile;
  } catch (err) {
    console.error("Error in fetchWahooProfile:", err);
    throw {
      message: err.message || "Connection error with Wahoo API",
      status: 502,
      details: err.details || err
    };
  }
}

async function fetchWahooActivities(access_token) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    console.log("Fetching Wahoo activities with access token...");
    const activitiesRes = await fetch("https://api.wahooligan.com/v1/activities", {
      headers: { "Authorization": `Bearer ${access_token}`, "Accept": "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!activitiesRes.ok) {
      const errorText = await activitiesRes.text();
      console.error("Failed to fetch Wahoo activities:", activitiesRes.status, errorText);
      throw {
        message: "Failed to fetch Wahoo activities",
        status: 502,
        details: errorText,
        httpStatus: activitiesRes.status
      };
    }
    
    const activities = await activitiesRes.json();
    console.log("Successfully fetched Wahoo activities:", Array.isArray(activities) ? activities.length : "none");
    return activities;
  } catch (err) {
    console.error("Error in fetchWahooActivities:", err);
    throw {
      message: err.message || "Connection error with Wahoo API",
      status: 502,
      details: err.details || err
    };
  }
}

async function upsertWahooProfile(client, user_id, wahoo_user_id, profile) {
  console.log("Upserting Wahoo profile for user:", user_id, "Wahoo user ID:", wahoo_user_id);
  
  // Use upsert with the user_id as the lookup key, wahoo_user_id as the Wahoo identifier
  const { error } = await client.from("wahoo_profiles").upsert([{
    id: user_id,
    wahoo_user_id: wahoo_user_id,
    weight_kg: profile.weight_kg,
    updated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString()
  }]);
  
  if (error) {
    console.error("Error upserting Wahoo profile:", error);
    throw error;
  }
  
  console.log("Successfully upserted Wahoo profile for user:", user_id);
}

async function upsertRoutes(client, user_id, activities) {
  console.log("Upserting routes for user:", user_id, "Activities count:", Array.isArray(activities) ? activities.length : 0);
  
  const routeRows = Array.isArray(activities) ? activities.map(act => ({
    user_id: user_id, // This links the routes to the user
    wahoo_route_id: act.id,
    name: act.name ?? "Wahoo Activity",
    distance: act.distance ?? 0,
    elevation: act.elevation_gain ?? 0,
    duration: act.duration ?? "",
    calories: act.calories ?? null,
    date: act.start_time ?? new Date().toISOString(),
    gpx_data: act.gpx_data ?? null,
    updated_at: new Date().toISOString()
  })) : [];

  let successCount = 0;
  for (const row of routeRows) {
    const { error } = await client.from("routes").upsert([row], { onConflict: ["user_id", "wahoo_route_id"] });
    if (error) {
      console.error("Error upserting route:", error, "Data:", JSON.stringify(row));
    } else {
      successCount++;
    }
  }
  
  console.log(`Successfully upserted ${successCount}/${routeRows.length} routes for user:`, user_id);
  return routeRows.length;
}

Deno.serve(async (req) => {
  // Add detailed logging about the request
  console.log("Received request:", {
    method: req.method,
    url: req.url,
    hasAuthHeader: !!req.headers.get("authorization"),
    contentType: req.headers.get("content-type"),
    contentLength: req.headers.get("content-length")
  });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth - Requires Auth Bearer header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const jwt = authHeader.split(" ")[1];

    // Parse request body with better error handling
    let body;
    try {
      body = await parseRequestJson(req);
      console.log("Request body parsed successfully:", {
        hasAccessToken: !!body.access_token,
        hasRefreshToken: !!body.refresh_token,
        hasWahooUserId: !!body.wahoo_user_id,
        hasUserId: !!body.user_id
      });
    } catch (err) {
      console.error("Error parsing request body:", err);
      return new Response(JSON.stringify({ 
        error: err.message || "Invalid request body",
        details: "Could not parse request JSON"
      }), { status: err.status || 400, headers: corsHeaders });
    }

    const { access_token, refresh_token, wahoo_user_id, user_id: clientProvidedUserId } = body;
    if (!access_token) {
      console.error("Missing access_token in request");
      return new Response(JSON.stringify({ error: "Missing access_token" }), { status: 400, headers: corsHeaders });
    }

    // Extract user_id from JWT and use it as the primary identifier
    const jwtUserId = extractUserIdFromJwt(jwt);
    if (!jwtUserId) {
      console.error("Could not extract user ID from JWT");
      return new Response(JSON.stringify({ error: "Invalid user JWT" }), { status: 401, headers: corsHeaders });
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
    } catch (err) {
      console.error("Wahoo profile fetch failed:", err.message);
      return new Response(JSON.stringify({ 
        error: err.message, 
        details: err.details, 
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

    // Fetch Wahoo activities (recent rides)
    let activities;
    try {
      activities = await fetchWahooActivities(access_token);
    } catch (err) {
      console.error("Wahoo activities fetch failed:", err.message);
      return new Response(JSON.stringify({ 
        error: err.message, 
        details: err.details, 
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

      await upsertWahooProfile(client, user_id, wahooProfileId, profile);
      const routeCount = await upsertRoutes(client, user_id, activities);

      console.log("Sync operation completed successfully for user:", user_id);
      return new Response(
        JSON.stringify({
          ok: true,
          profile,
          routeCount
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err) {
      console.error("Database operation error:", err);
      return new Response(
        JSON.stringify({
          error: "Database operation failed",
          details: err.message || "Unknown database error"
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (err) {
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
