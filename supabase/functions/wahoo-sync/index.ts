
// Edge function: Fetches Wahoo user profile and recent routes and stores them in the database

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

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

    // Expect POST { access_token, refresh_token }
    const body = await req.json();
    const { access_token, refresh_token } = body;
    if (!access_token) {
      return new Response(JSON.stringify({ error: "Missing access_token" }), { status: 400, headers: corsHeaders });
    }

    // Parse JWT to get user id from "sub"
    function parseJwt(token) {
      try {
        return JSON.parse(atob(token.split('.')[1]));
      } catch { return {}; }
    }
    const payload = parseJwt(jwt);
    const user_id = payload.sub;
    if (!user_id) {
      return new Response(JSON.stringify({ error: "Invalid user JWT" }), { status: 401, headers: corsHeaders });
    }

    console.log("Starting Wahoo data fetching for user:", user_id);

    // 1. Fetch Wahoo profile with timeout and retry
    let profileRes;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      profileRes = await fetch("https://api.wahooligan.com/v1/user", {
        headers: { 
          "Authorization": `Bearer ${access_token}`,
          "Accept": "application/json"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!profileRes.ok) {
        const errorText = await profileRes.text();
        console.error("Wahoo profile fetch error:", profileRes.status, errorText);
        return new Response(
          JSON.stringify({ 
            error: "Failed to fetch Wahoo profile", 
            status: profileRes.status,
            details: errorText
          }), 
          { status: 502, headers: corsHeaders }
        );
      }
    } catch (err) {
      console.error("Exception fetching Wahoo profile:", err);
      return new Response(
        JSON.stringify({ 
          error: "Connection error with Wahoo API", 
          details: err.message || "Network error" 
        }), 
        { status: 502, headers: corsHeaders }
      );
    }
    
    const profile = await profileRes.json();
    console.log("Successfully fetched Wahoo profile");

    // 2. Fetch Wahoo routes (recent activities) with timeout
    let activitiesRes;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      activitiesRes = await fetch("https://api.wahooligan.com/v1/activities", {
        headers: { 
          "Authorization": `Bearer ${access_token}`,
          "Accept": "application/json"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!activitiesRes.ok) {
        const errorText = await activitiesRes.text();
        console.error("Wahoo activities fetch error:", activitiesRes.status, errorText);
        return new Response(
          JSON.stringify({ 
            error: "Failed to fetch Wahoo activities", 
            status: activitiesRes.status,
            details: errorText
          }), 
          { status: 502, headers: corsHeaders }
        );
      }
    } catch (err) {
      console.error("Exception fetching Wahoo activities:", err);
      return new Response(
        JSON.stringify({ 
          error: "Connection error with Wahoo API", 
          details: err.message || "Network error" 
        }), 
        { status: 502, headers: corsHeaders }
      );
    }
    
    const activities = await activitiesRes.json();
    console.log("Successfully fetched Wahoo activities:", Array.isArray(activities) ? activities.length : "none");

    // 3. Insert/update profile and upsert routes
    const client = require("supabase-js").createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // (a) Upsert profile
    await client.from("wahoo_profiles").upsert([{
      id: user_id,
      wahoo_user_id: profile.id,
      weight_kg: profile.weight_kg,
      updated_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString()
    }]);

    // (b) Upsert activities as routes (pick relevant fields)
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
    
    console.log(`Processing ${routeRows.length} activities for storage`);
    
    for (const row of routeRows) {
      await client.from("routes").upsert([row], { onConflict: ["user_id", "wahoo_route_id"] });
    }

    console.log("Sync operation completed successfully");
    return new Response(
      JSON.stringify({ 
        ok: true, 
        profile, 
        routeCount: routeRows.length 
      }), 
      { status: 200, headers: corsHeaders }
    );
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
