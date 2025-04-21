
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

// For development testing, let's use the main Wahoo API URL
const WAHOO_AUTH_URL = "https://api.wahooligan.com/oauth/authorize";

// Update the redirect URI to match what's registered in Wahoo's dashboard
const REDIRECT_URI = "https://jxouzttcjpmmtclagbob.supabase.co/auth/v1/callback";
const SCOPE = "email power_zones_read workouts_read plans_read routes_read user_read"; // Updated to match your Wahoo config

export function WahooConnectButton() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const location = useLocation();

  // Check for connection success parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wahooConnected = params.get("wahoo_connected");
    
    if (wahooConnected === "success") {
      setIsConnected(true);
      toast({
        title: "Wahoo Connected",
        description: "Your Wahoo account was successfully connected!",
        // Changed from 'success' to 'default' since 'success' is not a valid variant
        variant: "default",
      });
      
      // Clean up the URL by removing the success parameter
      const newUrl = location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location, toast]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setStatusMessage("Fetching client ID...");
      
      // Use Supabase to invoke the edge function
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
      
      // Construct authorization URL
      const authUrl = 
        `${WAHOO_AUTH_URL}?response_type=code` +
        `&client_id=${encodeURIComponent(data.clientId)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}` +
        `&state=${encodeURIComponent(btoa(JSON.stringify({ timestamp: Date.now() })))}`;
      
      console.log("Redirecting to Wahoo auth URL:", authUrl);
      
      // Create a popup window for the authorization
      const popupWidth = 800;
      const popupHeight = 600;
      const left = window.innerWidth / 2 - popupWidth / 2;
      const top = window.innerHeight / 2 - popupHeight / 2;
      
      const popup = window.open(
        authUrl, 
        "WahooAuthPopup", 
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
      );
      
      // Check if popup was blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setIsConnecting(false);
        setStatusMessage("");
        throw new Error("Popup was blocked by the browser. Please allow popups for this site.");
      }
      
      // Poll for popup closure
      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheckInterval);
          setIsConnecting(false);
          setStatusMessage("");
          
          // Check if we've been disconnected from Supabase during the OAuth flow
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
              toast({
                title: "Session expired",
                description: "Your login session has expired. Please sign in again.",
                variant: "destructive",
              });
              // Redirect to login if needed
            } else {
              // All good, session still valid
              setIsConnected(true);
              toast({
                title: "Wahoo Connected",
                description: "Your Wahoo account was successfully connected!",
                // Changed from 'success' to 'default' since 'success' is not a valid variant
                variant: "default",
              });
            }
          });
        }
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
        variant={isConnected ? "default" : "outline"}
        className="gap-2" 
        onClick={handleConnect}
        disabled={isConnecting || isConnected}
      >
        {/* Wahoo SVG icon */}
        <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
          <path d="M12 17.5L6 14.5V8L12 5L18 8V14.5L12 17.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {isConnecting ? "Connecting..." : isConnected ? "Wahoo Connected" : "Connect Wahoo"}
      </Button>
      {statusMessage && (
        <p className="text-xs text-muted-foreground">{statusMessage}</p>
      )}
    </div>
  );
}
