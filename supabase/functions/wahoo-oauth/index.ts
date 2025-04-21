
// Edge function: Handles OAuth2 callback from Wahoo and exchanges code for access token

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

// Only use the primary Wahoo API domain for token exchange
const WAHOO_TOKEN_URL = "https://api.wahooligan.com/oauth/token";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();
  
  console.log("Request to wahoo-oauth edge function:", { 
    path, 
    method: req.method, 
    url: url.toString(),
    headers: Object.fromEntries([...req.headers]),
    query: Object.fromEntries([...url.searchParams])
  });
  
  // Route to get the client ID (keeps it secure)
  if (path === "get-client-id") {
    try {
      const clientId = Deno.env.get("WAHOO_CLIENT_ID");
      
      if (!clientId) {
        console.error("Wahoo client ID not configured");
        return new Response(
          JSON.stringify({ error: "Wahoo client ID not configured." }),
          { 
            status: 500, 
            headers: corsHeaders
          }
        );
      }
      
      console.log("Successfully retrieved client ID:", clientId.substring(0, 5) + "...");
      return new Response(
        JSON.stringify({ clientId }),
        { 
          status: 200,
          headers: corsHeaders
        }
      );
    } catch (error) {
      console.error("Error retrieving client ID:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error", details: error.message }),
        { 
          status: 500, 
          headers: corsHeaders
        }
      );
    }
  }
  
  // Route to exchange the authorization code for a token
  if (path === "token-exchange") {
    try {
      // Get code from request body
      const body = await req.json();
      const { code, redirectUri } = body;
      
      console.log("Token exchange request received with:", { 
        hasCode: !!code, 
        hasRedirectUri: !!redirectUri, 
        redirectUri
      });
      
      if (!code) {
        console.error("No code provided for token exchange");
        return new Response(
          JSON.stringify({ error: "Authorization code is required" }),
          { 
            status: 400, 
            headers: corsHeaders
          }
        );
      }
      
      const clientId = Deno.env.get("WAHOO_CLIENT_ID");
      const clientSecret = Deno.env.get("WAHOO_CLIENT_SECRET");
      
      if (!clientId || !clientSecret) {
        console.error("Wahoo client credentials not configured");
        return new Response(
          JSON.stringify({ error: "Wahoo client credentials not configured." }),
          { 
            status: 500, 
            headers: corsHeaders
          }
        );
      }
      
      console.log("Exchanging code for token with params:", { 
        hasCode: !!code, 
        hasClientId: !!clientId, 
        hasClientSecret: !!clientSecret,
        redirectUri
      });
      
      // Build the request body for token exchange
      const formData = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri
      });
      
      console.log("Sending token request to Wahoo with form data keys:", 
        [...formData.keys()].join(", "));
      
      // Exchange the code for a token
      const tokenResponse = await fetch(WAHOO_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData
      });
      
      const responseText = await tokenResponse.text();
      let tokenData;
      
      try {
        tokenData = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse token response as JSON:", responseText);
        return new Response(
          JSON.stringify({ 
            error: "Invalid response from Wahoo token endpoint", 
            details: "Response was not valid JSON"
          }),
          { 
            status: 502, 
            headers: corsHeaders
          }
        );
      }
      
      if (!tokenResponse.ok) {
        console.error("Token exchange error:", tokenData, "Status:", tokenResponse.status);
        return new Response(
          JSON.stringify({ 
            error: "Failed to exchange code for token", 
            status: tokenResponse.status,
            details: tokenData.error || tokenResponse.statusText 
          }),
          { 
            status: tokenResponse.status, 
            headers: corsHeaders
          }
        );
      }
      
      console.log("Successfully exchanged code for token:", {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in
      });
      
      // Return the token to the client
      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in
        }),
        { 
          status: 200,
          headers: corsHeaders
        }
      );
    } catch (error) {
      console.error("Error during token exchange:", error);
      return new Response(
        JSON.stringify({ 
          error: "Token exchange failed", 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: corsHeaders
        }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Invalid endpoint" }),
    { 
      status: 404,
      headers: corsHeaders
    }
  );
});
