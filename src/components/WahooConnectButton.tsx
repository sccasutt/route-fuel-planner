
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// For development testing, let's try both the API domains that Wahoo might use
const WAHOO_AUTH_URLS = [
  "https://api.wahooligan.com/oauth/authorize",
  "https://api.wahoofitness.com/oauth/authorize" // Alternative domain
];
// Change the redirect URI to include the origin, ensuring it matches what's registered in Wahoo
const REDIRECT_URI = window.location.origin + "/functions/v1/wahoo-oauth";
const SCOPE = "user_read workout_read"; // Adjust scopes as needed for your app

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
      
      // Try connecting to each possible Wahoo API URL
      let connectionSuccess = false;
      let workingAuthUrl = null;
      let authUrl = "";
      
      setStatusMessage("Testing API connectivity...");
      
      // Test both URLs to see which one works
      for (const apiUrl of WAHOO_AUTH_URLS) {
        try {
          console.log(`Testing connectivity to ${apiUrl}...`);
          // Make a simple HEAD request to test connectivity
          const testResponse = await fetch(apiUrl, { 
            method: 'HEAD',
            mode: 'no-cors'  // Using no-cors to just check connectivity
          });
          
          console.log(`${apiUrl} appears accessible`);
          workingAuthUrl = apiUrl;
          connectionSuccess = true;
          break;
        } catch (networkError) {
          console.warn(`Could not connect to ${apiUrl}:`, networkError);
          // Continue to try the next URL
        }
      }
      
      if (!connectionSuccess) {
        console.error("Could not connect to any Wahoo API URL");
        setStatusMessage("");
        toast({
          title: "Connection Issue",
          description: "Unable to reach Wahoo's servers. Please check your internet connection and try again.",
          variant: "destructive",
        });
        setIsConnecting(false);
        return;
      }
      
      setStatusMessage("Redirecting to Wahoo...");
      
      // Construct authorization URL using the working API URL
      authUrl = 
        `${workingAuthUrl}?response_type=code` +
        `&client_id=${encodeURIComponent(data.clientId)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}`;
      
      console.log("Redirecting to Wahoo auth URL:", authUrl);
      
      // Use a short delay before redirecting to ensure the user sees the status
      setTimeout(() => {
        window.location.href = authUrl;
      }, 1000);
      
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
