
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// For development testing, let's use the main Wahoo API URL
const WAHOO_AUTH_URL = "https://api.wahooligan.com/oauth/authorize";

// Update the redirect URI to match what's registered in Wahoo's dashboard
const REDIRECT_URI = "https://jxouzttcjpmmtclagbob.supabase.co/auth/v1/callback";
const SCOPE = "email power_zones_read workouts_read plans_read routes_read user_read"; // Updated to match your Wahoo config

export function WahooConnectButton() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setStatusMessage("Fetching client ID...");
      
      // Use Supabase to invoke the edge function with a timeout
      const { data, error } = await supabase.functions.invoke('wahoo-oauth/get-client-id', {
        method: 'GET',
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
      
      setStatusMessage("Redirecting to Wahoo authorization...");
      
      // Construct authorization URL - we're using the main URL without testing
      const authUrl = 
        `${WAHOO_AUTH_URL}?response_type=code` +
        `&client_id=${encodeURIComponent(data.clientId)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}`;
      
      console.log("Redirecting to Wahoo auth URL:", authUrl);
      
      // Redirect directly without pre-testing
      window.location.href = authUrl;
      
    } catch (error) {
      console.error("Error initiating Wahoo connection:", error);
      setStatusMessage("");
      toast({
        title: "Failed to connect to Wahoo",
        description: error.message || "Please try again later or contact support.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
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
      {statusMessage && (
        <p className="text-xs text-muted-foreground">{statusMessage}</p>
      )}
    </div>
  );
}
