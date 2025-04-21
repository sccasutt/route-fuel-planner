
// Edge function: Handles OAuth2 callback from Wahoo and exchanges code for access token

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

// Only use the primary Wahoo API domain for token exchange
const WAHOO_TOKEN_URL = "https://api.wahooligan.com/oauth/token";

// The exact redirect URI that must match what's configured in Wahoo's dashboard
const REDIRECT_URI = "https://jxouzttcjpmmtclagbob.supabase.co/functions/v1/wahoo-oauth";

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
  
  // Log all parameters to help debugging
  console.log("OAuth callback parameters:", {
    code: code ? "present" : "missing",
    error,
    errorDescription,
    state: url.searchParams.get("state"),
    allParams: Object.fromEntries([...url.searchParams])
  });
  
  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Failed</title>
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
          .error-message {
            text-align: center;
            padding: 20px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 400px;
          }
          h1 {
            color: #ef4444;
            margin-bottom: 10px;
          }
          p {
            margin-bottom: 20px;
            color: #374151;
          }
        </style>
      </head>
      <body>
        <div class="error-message">
          <h1>Connection Failed</h1>
          <p>There was an error connecting to Wahoo: ${error}</p>
          <p>${errorDescription || ''}</p>
          <p>This window will close automatically.</p>
        </div>
        <script>
          // Send message to parent window
          if (window.opener) {
            window.opener.postMessage({ type: 'wahoo-error', error: '${error}', description: '${errorDescription || ''}' }, '*');
            // Close this window after a short delay
            setTimeout(function() {
              window.close();
            }, 3000);
          } else {
            document.body.innerHTML += '<p>Unable to communicate with the main window. Please close this window manually.</p>';
          }
        </script>
      </body>
      </html>
      `,
      { 
        status: 400, 
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html"
        }
      }
    );
  }

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
    console.log(`Redirect URI being used: ${REDIRECT_URI}`);
    
    // Exchange code for token
    const tokenRes = await fetch(WAHOO_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
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
        status: responseData.status,
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
      
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Connection Failed</title>
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
            .error-message {
              text-align: center;
              padding: 20px;
              background-color: #fff;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              max-width: 400px;
            }
            h1 {
              color: #ef4444;
              margin-bottom: 10px;
            }
            p {
              margin-bottom: 20px;
              color: #374151;
            }
          </style>
        </head>
        <body>
          <div class="error-message">
            <h1>Connection Failed</h1>
            <p>Failed to exchange authorization code for access token.</p>
            <p>${responseData?.error_description || responseData?.error || ''}</p>
            <p>This window will close automatically.</p>
          </div>
          <script>
            // Send message to parent window
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'wahoo-error', 
                error: 'Token exchange failed', 
                description: '${responseData?.error_description || responseData?.error || 'Unknown error'}' 
              }, '*');
              // Close this window after a short delay
              setTimeout(function() {
                window.close();
              }, 3000);
            } else {
              document.body.innerHTML += '<p>Unable to communicate with the main window. Please close this window manually.</p>';
            }
          </script>
        </body>
        </html>
        `, 
        {
          status: tokenRes.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "text/html"
          },
        }
      );
    }

    // Return a success response with HTML that will close the window automatically
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
          if (window.opener) {
            window.opener.postMessage({ type: 'wahoo-connected', success: true }, '*');
            // Close this window after a short delay
            setTimeout(function() {
              window.close();
            }, 2000);
          } else {
            document.body.innerHTML += '<p>Unable to communicate with the main window. Please close this window manually.</p>';
          }
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
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Failed</title>
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
          .error-message {
            text-align: center;
            padding: 20px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 400px;
          }
          h1 {
            color: #ef4444;
            margin-bottom: 10px;
          }
          p {
            margin-bottom: 20px;
            color: #374151;
          }
        </style>
      </head>
      <body>
        <div class="error-message">
          <h1>Connection Failed</h1>
          <p>An unexpected error occurred: ${error.message}</p>
          <p>This window will close automatically.</p>
        </div>
        <script>
          // Send message to parent window
          if (window.opener) {
            window.opener.postMessage({ type: 'wahoo-error', error: 'Unexpected error' }, '*');
            // Close this window after a short delay
            setTimeout(function() {
              window.close();
            }, 3000);
          } else {
            document.body.innerHTML += '<p>Unable to communicate with the main window. Please close this window manually.</p>';
          }
        </script>
      </body>
      </html>
      `,
      { 
        status: 500, 
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html"
        }
      }
    );
  }
});
