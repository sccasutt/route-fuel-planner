
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

  // OAuth callback handler
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response(
      JSON.stringify({ error: "Missing OAuth code parameter" }),
      { 
        status: 400, 
        headers: corsHeaders
      }
    );
  }

  // Secrets are injected as env variables in Supabase Edge Functions.
  const clientId = Deno.env.get("WAHOO_CLIENT_ID");
  const clientSecret = Deno.env.get("WAHOO_CLIENT_SECRET");
  
  // Update the redirect URI to match what's registered in Wahoo's dashboard
  const redirectUri = "https://jxouzttcjpmmtclagbob.supabase.co/auth/v1/callback";

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ error: "Wahoo client secrets not configured." }),
      { 
        status: 500, 
        headers: corsHeaders
      }
    );
  }

  try {
    console.log("Attempting to exchange code for token");
    console.log(`Redirect URI being used: ${redirectUri}`);
    
    // Exchange code for token
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
      const errorText = await tokenRes.text();
      console.error("Token exchange failed:", {
        status: tokenRes.status,
        statusText: tokenRes.statusText,
        body: errorText
      });
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to exchange authorization code for access token", 
          details: errorText 
        }), 
        {
          status: tokenRes.status,
          headers: corsHeaders,
        }
      );
    }

    const tokenData = await tokenRes.json();
    console.log("Token successfully obtained");

    // Return a success response with HTML that will close the window automatically
    // This approach avoids the signed out message and ensures the window closes
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Successful</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f8f9fa;
          }
          .success-message {
            text-align: center;
            padding: 20px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 400px;
          }
          h1 {
            color: #10b981;
            margin-bottom: 10px;
          }
          p {
            margin-bottom: 20px;
            color: #374151;
          }
        </style>
      </head>
      <body>
        <div class="success-message">
          <h1>Connection Successful!</h1>
          <p>Your Wahoo account has been connected successfully. This window will close automatically.</p>
        </div>
        <script>
          // Send message to parent window
          window.opener.postMessage({ type: 'wahoo-connected', success: true }, '*');
          // Close this window after a short delay
          setTimeout(function() {
            window.close();
          }, 2000);
        </script>
      </body>
      </html>
      `,
      { 
        status: 200, 
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html"
        }
      }
    );
  } catch (error) {
    console.error("Wahoo OAuth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { 
        status: 500, 
        headers: corsHeaders
      }
    );
  }
});
