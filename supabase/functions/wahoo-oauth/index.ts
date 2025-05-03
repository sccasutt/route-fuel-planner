
// Edge function: Handles Wahoo OAuth2 Client ID fetching and token exchange

// CORS headers 
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

Deno.serve(async (req) => {
  // Log request details for debugging
  console.log("Request to wahoo-oauth edge function:", {
    path: req.url.split("/").pop(),
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    query: Object.fromEntries(new URL(req.url).searchParams.entries())
  });

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Determine which endpoint is being called
    const path = req.url.split("/").pop();

    // 1. Client ID retrieval endpoint
    if (path === "get-client-id") {
      try {
        const clientId = Deno.env.get("WAHOO_CLIENT_ID");
        
        if (!clientId) {
          console.error("Wahoo client ID not found in environment variables");
          return new Response(
            JSON.stringify({ error: "Wahoo client ID not configured on server" }),
            { status: 500, headers: corsHeaders }
          );
        }
        
        console.log("Successfully retrieved client ID:", clientId.substring(0, 5) + "...");
        return new Response(JSON.stringify({ clientId }), { 
          status: 200, 
          headers: corsHeaders 
        });
      } catch (error) {
        console.error("Error retrieving client ID:", error);
        return new Response(
          JSON.stringify({ error: "Failed to retrieve client ID" }),
          { status: 500, headers: corsHeaders }
        );
      }
    }
    
    // 2. Token exchange endpoint
    if (path === "token-exchange") {
      // Get request body
      const body = await req.json();
      
      console.log("Token exchange request received with:", {
        hasCode: !!body.code,
        hasRedirectUri: !!body.redirectUri,
        redirectUri: body.redirectUri
      });
      
      const { code, redirectUri } = body;
      
      if (!code || !redirectUri) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters: code and redirectUri" }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Get credentials
      const clientId = Deno.env.get("WAHOO_CLIENT_ID");
      const clientSecret = Deno.env.get("WAHOO_CLIENT_SECRET");
      
      if (!clientId || !clientSecret) {
        console.error("Missing Wahoo credentials in environment variables");
        return new Response(
          JSON.stringify({ error: "Wahoo integration not properly configured on server" }),
          { status: 500, headers: corsHeaders }
        );
      }
      
      console.log("Exchanging code for token with params:", {
        hasCode: !!code,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        redirectUri
      });

      // Build form data for token request
      const formData = new URLSearchParams();
      formData.append("grant_type", "authorization_code");
      formData.append("client_id", clientId);
      formData.append("client_secret", clientSecret);
      formData.append("code", code);
      formData.append("redirect_uri", redirectUri);
      
      console.log("Sending token request to Wahoo with form data keys:", [...formData.keys()].join(", "));
      
      // Exchange code for token
      try {
        const response = await fetch("https://api.wahooligan.com/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Token exchange error:", response.status, errorText);
          return new Response(
            JSON.stringify({ 
              error: "Failed to exchange code for token", 
              status: response.status, 
              details: errorText 
            }),
            { status: 502, headers: corsHeaders }
          );
        }
        
        // Get token data
        const tokenData = await response.json();

        // Fetch Wahoo user ID to return with token
        try {
          // Use the newly acquired access token to get user info
          const userResponse = await fetch("https://api.wahooligan.com/v1/user", {
            headers: {
              "Authorization": `Bearer ${tokenData.access_token}`,
              "Accept": "application/json"
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            
            // Add Wahoo user ID to token response
            if (userData && userData.id) {
              tokenData.wahoo_user_id = userData.id;
              console.log("Added Wahoo user ID to token response:", userData.id);
            }
          } else {
            console.error("Could not fetch Wahoo user ID:", userResponse.status);
          }
        } catch (userErr) {
          console.error("Error fetching Wahoo user profile for ID:", userErr);
          // We don't fail the whole request if this fails, just continue without the ID
        }
        
        console.log("Successfully exchanged code for token:", { 
          hasAccessToken: !!tokenData.access_token, 
          hasRefreshToken: !!tokenData.refresh_token, 
          expiresIn: tokenData.expires_in,
          hasWahooUserId: !!tokenData.wahoo_user_id
        });
        
        // Return token data
        return new Response(JSON.stringify(tokenData), { 
          status: 200, 
          headers: corsHeaders 
        });
      } catch (error) {
        console.error("Token request exception:", error);
        return new Response(
          JSON.stringify({ 
            error: "Failed to exchange code for token", 
            details: error.message || "Unknown error" 
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    }
    
    // 3. Handle disconnect request
    if (req.method === 'POST') {
      const body = await req.json();
      
      if (body.action === "disconnect") {
        const userId = body.userId;
        console.log("Processing disconnect request for user:", userId);
        
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Missing userId parameter" }),
            { status: 400, headers: corsHeaders }
          );
        }
        
        // Get Supabase client to clean up database
        try {
          // Get Supabase client
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
          
          if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase credentials");
          }
          
          const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // First get the Wahoo access token to revoke it
          const { data: wahooProfile } = await supabase
            .from('wahoo_profiles')
            .select('wahoo_user_id')
            .eq('id', userId)
            .single();
          
          // Clean up database entries
          // Delete the wahoo profile
          const { error: deleteError } = await supabase
            .from('wahoo_profiles')
            .delete()
            .eq('id', userId);
            
          if (deleteError) {
            console.error("Error deleting Wahoo profile:", deleteError);
          } else {
            console.log("Successfully deleted Wahoo profile for user:", userId);
          }
          
          // We can't revoke the token on Wahoo side without storing the tokens in the database
          // But this is fine since we've cleaned up our database records
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Wahoo account disconnected successfully" 
            }),
            { status: 200, headers: corsHeaders }
          );
        } catch (error) {
          console.error("Error disconnecting Wahoo account:", error);
          return new Response(
            JSON.stringify({ 
              error: "Error disconnecting Wahoo account", 
              details: error.message || "Unknown error" 
            }),
            { status: 500, headers: corsHeaders }
          );
        }
      }
    }
    
    // 4. Invalid endpoint
    return new Response(
      JSON.stringify({ error: "Invalid endpoint" }),
      { status: 404, headers: corsHeaders }
    );
    
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message || "Unknown error" 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
