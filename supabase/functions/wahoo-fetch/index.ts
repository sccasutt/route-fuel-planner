
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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Start OAuth flow - redirect user to Wahoo authorization page
    if (action === "authorize") {
      const redirectUri = url.searchParams.get("redirect_uri");
      if (!redirectUri) {
        return jsonResponse({ error: "Missing redirect_uri parameter" }, 400);
      }

      const state = Math.random().toString(36).substring(2, 15);
      const authUrl = new URL("https://api.wahooligan.com/oauth/authorize");
      authUrl.searchParams.append("client_id", WAHOO_CLIENT_ID);
      authUrl.searchParams.append("redirect_uri", redirectUri);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", "profile:read workout:read user:read");
      authUrl.searchParams.append("state", state);

      return jsonResponse({ authUrl: authUrl.toString(), state });
    }

    // Exchange authorization code for access token
    if (action === "token") {
      const requestData = await req.json();
      const { code, redirect_uri } = requestData;

      if (!code || !redirect_uri) {
        return jsonResponse({ error: "Missing code or redirect_uri in request body" }, 400);
      }

      const tokenResponse = await fetch("https://api.wahooligan.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: WAHOO_CLIENT_ID,
          client_secret: WAHOO_CLIENT_SECRET,
          code,
          redirect_uri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Wahoo token exchange failed:", errorText);
        return jsonResponse({ error: "Failed to exchange code for token" }, tokenResponse.status);
      }

      const tokenData = await tokenResponse.json();
      return jsonResponse({ token: tokenData });
    }

    // Fetch user profile data using existing token
    if (action === "profile") {
      const { access_token } = await req.json();

      if (!access_token) {
        return jsonResponse({ error: "Missing access_token in request body" }, 400);
      }

      // Fetch user profile from Wahoo API
      const profileResponse = await fetch("https://api.wahooligan.com/v1/user", {
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
      return jsonResponse({ profile: profileData });
    }

    return jsonResponse({ error: "Invalid action parameter. Use 'authorize', 'token', or 'profile'" }, 400);
  } catch (error) {
    console.error("Error in Wahoo Fetch function:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
