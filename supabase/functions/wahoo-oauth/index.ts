// Edge function: Handles OAuth2 callback from Wahoo and exchanges code for access token

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Updated to the correct Wahoo API domain
const WAHOO_TOKEN_URL = "https://api.wahooligan.com/oauth/token";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();
  
  // Route to get the client ID (keeps it secure)
  if (path === "get-client-id") {
    try {
      const clientId = Deno.env.get("WAHOO_CLIENT_ID");
      
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: "Wahoo client ID not configured." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ clientId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error retrieving client ID:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // OAuth callback handler
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response(
      JSON.stringify({ error: "Missing OAuth code parameter" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Secrets are injected as env variables in Supabase Edge Functions.
  const clientId = Deno.env.get("WAHOO_CLIENT_ID");
  const clientSecret = Deno.env.get("WAHOO_CLIENT_SECRET");
  const redirectUri = `${url.origin}/functions/v1/wahoo-oauth`; // This should match your OAuth app's registered callback.

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ error: "Wahoo client secrets not configured." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("Exchanging code for token with Wahoo API");
    
    // Exchange code for token (according to Wahoo API docs)
    const tokenRes = await fetch(WAHOO_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const error = await tokenRes.text();
      console.error("Token exchange failed:", error);
      return new Response(JSON.stringify({ error: "Token exchange failed", details: error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenData = await tokenRes.json();
    console.log("Wahoo Token Received");

    // Store the token data in Supabase for this user
    // This step would typically involve:
    // 1. Getting the current user's ID
    // 2. Storing the tokens in your database
    // 3. Setting up a refresh token workflow
    
    // For now, we'll just return success and redirect to a success page
    const successUrl = new URL("/profile", url.origin);
    successUrl.searchParams.set("connection", "success");
    
    return new Response(null, {
      status: 302,
      headers: { 
        ...corsHeaders, 
        "Location": successUrl.toString()
      },
    });
  } catch (error) {
    console.error("Wahoo OAuth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
