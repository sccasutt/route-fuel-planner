
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";

serve(async (req) => {
  try {
    const { SUPABASE_URL, SUPABASE_ANON_KEY, WAHOO_CLIENT_ID, WAHOO_CLIENT_SECRET } = Deno.env.toObject();
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Missing Supabase environment variables");
    }
    
    if (!WAHOO_CLIENT_ID || !WAHOO_CLIENT_SECRET) {
      throw new Error("Missing Wahoo API secrets");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    
    // Handle error from Wahoo
    if (error) {
      console.error("Wahoo OAuth error:", error);
      return new Response(
        `<html><body><h1>Authorization Failed</h1><p>${error}</p><script>setTimeout(() => { window.location.href = '/profile?error=${encodeURIComponent(error)}'; }, 2000);</script></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }
    
    if (!code) {
      return new Response(
        `<html><body><h1>Missing Authorization Code</h1><script>setTimeout(() => { window.location.href = '/profile?error=missing_code'; }, 2000);</script></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }
    
    // Exchange the code for access/refresh tokens
    const redirectUri = `${url.origin}/functions/v1/wahoo-callback`;
    const tokenResponse = await fetch("https://api.wahooligan.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: WAHOO_CLIENT_ID,
        client_secret: WAHOO_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Wahoo token exchange failed:", errorText);
      return new Response(
        `<html><body><h1>Token Exchange Failed</h1><script>setTimeout(() => { window.location.href = '/profile?error=token_exchange_failed'; }, 2000);</script></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        `<html><body><h1>Authentication Required</h1><p>Please log in to connect your Wahoo account.</p><script>setTimeout(() => { window.location.href = '/login?redirect=/profile'; }, 2000);</script></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }
    
    // Store the Wahoo tokens in the user's metadata (or a separate table)
    const { error: updateError } = await supabase
      .from("user_connections")
      .upsert({
        user_id: session.user.id,
        provider: "wahoo",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        created_at: new Date().toISOString(),
      });
    
    if (updateError) {
      console.error("Failed to save Wahoo tokens:", updateError);
      return new Response(
        `<html><body><h1>Failed to Save Connection</h1><script>setTimeout(() => { window.location.href = '/profile?error=save_failed'; }, 2000);</script></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }
    
    // Redirect back to the profile page with success message
    return new Response(
      `<html><body><h1>Wahoo Connected Successfully!</h1><script>setTimeout(() => { window.location.href = '/profile?connected=true'; }, 1000);</script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Wahoo callback error:", error);
    return new Response(
      `<html><body><h1>Error</h1><p>${error.message}</p><script>setTimeout(() => { window.location.href = '/profile?error=internal_error'; }, 2000);</script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }
});
