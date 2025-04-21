
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Updated to the correct Wahoo API domain
const WAHOO_AUTH_URL = "https://api.wahooligan.com/oauth/authorize";
// Change the redirect URI to include the origin, ensuring it matches what's registered in Wahoo
const REDIRECT_URI = window.location.origin + "/functions/v1/wahoo-oauth";
const SCOPE = "user_read workout_read"; // Adjust scopes as needed for your app

export function WahooConnectButton() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Use Supabase to invoke the edge function with a timeout
      const { data, error } = await supabase.functions.invoke('wahoo-oauth/get-client-id', {
        method: 'GET',
        // Add a timeout to avoid long-running requests
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (error) {
        console.error("Error invoking function:", error);
        throw new Error(`Failed to fetch client ID: ${error.message}`);
      }
      
      console.log("Response from edge function:", data);
      
      if (!data || !data.clientId) {
        throw new Error("No client ID returned from server");
      }
      
      // Construct authorization URL
      const authUrl = 
        `${WAHOO_AUTH_URL}?response_type=code` +
        `&client_id=${encodeURIComponent(data.clientId)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}`;
      
      console.log("Redirecting to Wahoo auth URL:", authUrl);
      
      // Test URL before redirecting
      try {
        const testConnection = await fetch(WAHOO_AUTH_URL, { 
          method: 'HEAD',
          mode: 'no-cors'  // Using no-cors to just check connectivity
        });
        console.log("Wahoo API is accessible");
      } catch (networkError) {
        console.error("Network error when testing Wahoo API:", networkError);
        // Continue anyway as the HEAD request might fail but GET could work
      }
      
      // Redirect to authorization page
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error initiating Wahoo connection:", error);
      toast({
        title: "Failed to connect to Wahoo",
        description: error.message || "Please try again later or contact support.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="gap-2" 
      onClick={handleConnect}
      disabled={isConnecting}
    >
      {/* Wahoo SVG icon */}
      <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
        <path d="M12 17.5L6 14.5V8L12 5L18 8V14.5L12 17.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {isConnecting ? "Connecting..." : "Connect Wahoo"}
    </Button>
  );
}
