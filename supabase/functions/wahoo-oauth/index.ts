// Edge function: Handles OAuth2 callback from Wahoo and exchanges code for access token

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

// Only use the primary Wahoo API domain for token exchange
const WAHOO_TOKEN_URL = "https://api.wahooligan.com/oauth/token";

// The app URL to redirect back to after OAuth process
const APP_REDIRECT_URL = "https://lovable.dev";

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

  // OAuth callback handler
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");
  const state = url.searchParams.get("state");
  
  // Log all parameters to help debugging
  console.log("OAuth callback parameters:", {
    code: code ? "present" : "missing",
    error,
    errorDescription,
    state,
    allParams: Object.fromEntries([...url.searchParams])
  });
  
  // Create redirect URL back to the app
  let redirectUrl = new URL(APP_REDIRECT_URL);
  
  // Add path to the dashboard
  redirectUrl.pathname = "/dashboard";
  
  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    
    // Add error parameters to the redirect URL
    redirectUrl.searchParams.set("wahoo_error", errorDescription || error);
    
    console.log("Redirecting to app with error:", redirectUrl.toString());
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": redirectUrl.toString()
      }
    });
  }

  if (!code) {
    console.error("Missing OAuth code parameter");
    redirectUrl.searchParams.set("wahoo_error", "Missing authorization code");
    
    console.log("Redirecting to app with error:", redirectUrl.toString());
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": redirectUrl.toString()
      }
    });
  }

  // Secrets are injected as env variables in Supabase Edge Functions.
  const clientId = Deno.env.get("WAHOO_CLIENT_ID");
  const clientSecret = Deno.env.get("WAHOO_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    console.error("Wahoo client secrets not configured");
    redirectUrl.searchParams.set("wahoo_error", "API configuration error");
    
    console.log("Redirecting to app with error:", redirectUrl.toString());
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": redirectUrl.toString()
      }
    });
  }

  try {
    console.log("Attempting to exchange code for token");
    
    // Exchange code for token
    const tokenRes = await fetch(WAHOO_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: url.origin + url.pathname,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const responseText = await tokenRes.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
      console.log("Token response status:", tokenRes.status);
      console.log("Token response parsed:", {
        success: tokenRes.ok,
        error: responseData.error,
        error_description: responseData.error_description
      });
    } catch (e) {
      console.log("Token response is not JSON:", responseText);
    }

    if (!tokenRes.ok) {
      console.error("Token exchange failed:", {
        status: tokenRes.status,
        statusText: tokenRes.statusText,
        body: responseText
      });
      
      redirectUrl.searchParams.set("wahoo_error", (responseData?.error_description || responseData?.error || "Token exchange failed"));
      
      console.log("Redirecting to app with error:", redirectUrl.toString());
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": redirectUrl.toString()
        }
      });
    }

    // Success - redirect back to the app with success parameter
    redirectUrl.searchParams.set("wahoo_success", "true");
    
    console.log("Auth successful, redirecting to app:", redirectUrl.toString());
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": redirectUrl.toString()
      }
    });
  } catch (error) {
    console.error("Wahoo OAuth error:", error);
    
    redirectUrl.searchParams.set("wahoo_error", error.message || "Unexpected error");
    
    console.log("Redirecting to app with error:", redirectUrl.toString());
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": redirectUrl.toString()
      }
    });
  }
});
