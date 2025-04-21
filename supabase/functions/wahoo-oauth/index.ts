
// Edge function: Handles OAuth2 callback from Wahoo and exchanges code for access token

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
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
    // Exchange code for token (according to Wahoo API docs)
    const tokenRes = await fetch("https://cloud-api.wahoofitness.com/oauth2/token", {
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

    console.log("Wahoo Token Received:", tokenData);

    return new Response(JSON.stringify({ success: true, token: tokenData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Wahoo OAuth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
