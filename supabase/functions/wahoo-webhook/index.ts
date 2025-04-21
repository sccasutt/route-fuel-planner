
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { WAHOO_CLIENT_SECRET } = Deno.env.toObject();

    if (!WAHOO_CLIENT_SECRET) {
      console.error("Missing Wahoo API secret");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Verify the webhook signature if provided
    const signature = req.headers.get("x-wahoo-signature");
    if (!signature) {
      console.error("Missing webhook signature");
      return new Response(JSON.stringify({ error: "Missing signature" }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const payload = await req.json();
    console.log("Received webhook payload:", payload);

    // Process different webhook event types
    switch (payload.type) {
      case "workout.created":
      case "workout.completed":
      case "workout.updated":
        console.log(`Processing ${payload.type} event:`, payload.data);
        // Add your webhook handling logic here
        break;
      default:
        console.log("Unhandled webhook event type:", payload.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
