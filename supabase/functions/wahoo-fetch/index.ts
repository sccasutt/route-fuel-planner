
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to send JSON response
const jsonResponse = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { WAHOO_CLIENT_ID, WAHOO_CLIENT_SECRET } = Deno.env.toObject();

    if (!WAHOO_CLIENT_ID || !WAHOO_CLIENT_SECRET) {
      console.error("Missing Wahoo API secrets");
      return jsonResponse({ error: "Missing Wahoo API secrets" }, 500);
    }

    const { access_token } = await req.json();

    if (!access_token) {
      return jsonResponse({ error: "Missing access_token in request body" }, 400);
    }

    // Example: Fetch user profile from Wahoo API (https://developers.wahooligan.com/cloud#get-user-profile)
    const profileResponse = await fetch("https://api.wahooligan.com/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
      },
    });

    if (!profileResponse.ok) {
      const msg = await profileResponse.text();
      console.error("Failed to fetch Wahoo profile:", msg);
      return jsonResponse({ error: "Failed to fetch Wahoo profile" }, profileResponse.status);
    }

    const profileData = await profileResponse.json();

    // You can extend this to fetch more data such as weight, goals, rides, nutrition, etc
    return jsonResponse({ profile: profileData });
  } catch (error) {
    console.error("Error in Wahoo Fetch function:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
