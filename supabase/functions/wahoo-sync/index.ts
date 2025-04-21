
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
    return await req.json();
  } catch (err) {
    console.error("Error parsing request body:", err);
    throw {
      message: "Invalid request body",
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
    const profileRes = await fetch("https://api.wahooligan.com/v1/user", {
      headers: { "Authorization": `Bearer ${access_token}`, "Accept": "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!profileRes.ok) {
      const errorText = await profileRes.text();
      throw {
        message: "Failed to fetch Wahoo profile",
        status: 502,
        details: errorText,
        httpStatus: profileRes.status
      };
    }
    return await profileRes.json();
  } catch (err) {
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
    const activitiesRes = await fetch("https://api.wahooligan.com/v1/activities", {
      headers: { "Authorization": `Bearer ${access_token}`, "Accept": "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!activitiesRes.ok) {
      const errorText = await activitiesRes.text();
      throw {
        message: "Failed to fetch Wahoo activities",
        status: 502,
        details: errorText,
        httpStatus: activitiesRes.status
      };
    }
    return await activitiesRes.json();
  } catch (err) {
    throw {
      message: err.message || "Connection error with Wahoo API",
      status: 502,
      details: err.details || err
    };
  }
}

async function upsertWahooProfile(client, user_id, wahoo_user_id, profile) {
  await client.from("wahoo_profiles").upsert([{
    id: user_id,
    wahoo_user_id: wahoo_user_id,
    weight_kg: profile.weight_kg,
    updated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString()
  }]);
}

async function upsertRoutes(client, user_id, activities) {
  const routeRows = Array.isArray(activities) ? activities.map(act => ({
    user_id,
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

  for (const row of routeRows) {
    await client.from("routes").upsert([row], { onConflict: ["user_id", "wahoo_route_id"] });
  }
  return routeRows.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth - Requires Auth Bearer header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const jwt = authHeader.split(" ")[1];

    // Parse request body
    let body;
    try {
      body = await parseRequestJson(req);
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.status, headers: corsHeaders });
    }

    const { access_token, refresh_token, wahoo_user_id } = body;
    if (!access_token) {
      return new Response(JSON.stringify({ error: "Missing access_token" }), { status: 400, headers: corsHeaders });
    }

    const user_id = extractUserIdFromJwt(jwt);
    if (!user_id) {
      return new Response(JSON.stringify({ error: "Invalid user JWT" }), { status: 401, headers: corsHeaders });
    }

    console.log("Starting Wahoo data fetching for user:", user_id, "Wahoo user ID:", wahoo_user_id || "not provided");

    // Fetch Wahoo profile
    let profile;
    try {
      profile = await fetchWahooProfile(access_token);
      console.log("Successfully fetched Wahoo profile, user ID:", profile.id);
    } catch (err) {
      console.error("Wahoo profile fetch failed:", err.message);
      return new Response(JSON.stringify({ error: err.message, details: err.details, status: err.httpStatus || 502 }), { status: err.status, headers: corsHeaders });
    }

    // Get the Wahoo user ID from the profile response if not provided in token
    const wahooProfileId = wahoo_user_id || profile.id;
    if (!wahooProfileId) {
      return new Response(JSON.stringify({ error: "Could not determine Wahoo user ID", details: "Neither token nor profile contained a Wahoo user ID" }), { status: 500, headers: corsHeaders });
    }

    // Fetch Wahoo activities (recent rides)
    let activities;
    try {
      activities = await fetchWahooActivities(access_token);
      console.log("Successfully fetched Wahoo activities:", Array.isArray(activities) ? activities.length : "none");
    } catch (err) {
      console.error("Wahoo activities fetch failed:", err.message);
      return new Response(JSON.stringify({ error: err.message, details: err.details, status: err.httpStatus || 502 }), { status: err.status, headers: corsHeaders });
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

      console.log("Sync operation completed successfully");
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
