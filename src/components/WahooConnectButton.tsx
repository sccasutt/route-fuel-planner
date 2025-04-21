
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// For Wahoo API integration
const WAHOO_AUTH_URL = "https://api.wahooligan.com/oauth/authorize";

// Use the edge function URL as the redirect URI - must match what's in Wahoo's dashboard
const REDIRECT_URI = "https://jxouzttcjpmmtclagbob.supabase.co/functions/v1/wahoo-oauth";
const SCOPE = "email power_zones_read workouts_read plans_read routes_read user_read";

export function WahooConnectButton() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [authWindow, setAuthWindow] = useState<Window | null>(null);
  
  // Add event listener for message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("Received message from popup:", event.data);
      
      if (event.data && event.data.type === 'wahoo-connected') {
        setIsConnecting(false);
        setStatusMessage("");
        setIsConnected(true);
        
        toast({
          title: "Wahoo Connected",
          description: "Your Wahoo account was successfully connected!",
          variant: "success",
        });
        
        // Close the popup window if it's still open
        if (authWindow && !authWindow.closed) {
          authWindow.close();
        }
      }
      
      if (event.data && event.data.type === 'wahoo-error') {
        setIsConnecting(false);
        setStatusMessage("");
        
        toast({
          title: "Connection Failed",
          description: event.data.description || event.data.error || "Failed to connect to Wahoo",
          variant: "destructive",
        });
        
        // Close the popup window if it's still open
        if (authWindow && !authWindow.closed) {
          authWindow.close();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast, authWindow]);
  
  // Add a poll to check if popup was closed
  useEffect(() => {
    let popupCheckInterval: number | undefined;
    
    if (isConnecting && authWindow) {
      popupCheckInterval = window.setInterval(() => {
        if (authWindow.closed) {
          setIsConnecting(false);
          setStatusMessage("");
          clearInterval(popupCheckInterval);
        }
      }, 500);
    }
    
    return () => {
      if (popupCheckInterval) {
        clearInterval(popupCheckInterval);
      }
    };
  }, [isConnecting, authWindow]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setStatusMessage("Fetching client ID...");
      
      // Use Supabase to invoke the edge function
      const { data, error } = await supabase.functions.invoke('wahoo-oauth/get-client-id', {
        method: 'GET'
      });
      
      if (error) {
        console.error("Error invoking function:", error);
        throw new Error(`Failed to fetch client ID: ${error.message}`);
      }
      
      console.log("Response from edge function:", data);
      
      if (!data || !data.clientId) {
        throw new Error("No client ID returned from server");
      }
      
      setStatusMessage("Opening authorization window...");
      
      // Generate a simple random string for state
      const state = Math.random().toString(36).substr(2, 10);
      
      // Construct authorization URL
      const authUrl = 
        `${WAHOO_AUTH_URL}?response_type=code` +
        `&client_id=${encodeURIComponent(data.clientId)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}` +
        `&state=${encodeURIComponent(state)}`;
      
      console.log("Redirecting to Wahoo auth URL:", authUrl);
      
      // Create a popup window for the authorization
      const popupWidth = 800;
      const popupHeight = 700;
      const left = window.innerWidth / 2 - popupWidth / 2;
      const top = window.innerHeight / 2 - popupHeight / 2;
      
      const popup = window.open(
        authUrl, 
        "WahooAuthPopup", 
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
      );
      
      setAuthWindow(popup);
      
      // Check if popup was blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setIsConnecting(false);
        setStatusMessage("");
        throw new Error("Popup was blocked by the browser. Please allow popups for this site.");
      }
      
      // Set a timeout to abort if taking too long
      setTimeout(() => {
        if (isConnecting) {
          setIsConnecting(false);
          setStatusMessage("");
          
          toast({
            title: "Connection timeout",
            description: "The connection process took too long. Please try again.",
            variant: "destructive",
          });
          
          if (popup && !popup.closed) {
            popup.close();
          }
        }
      }, 120000); // 2 minutes timeout
      
    } catch (error) {
      console.error("Error initiating Wahoo connection:", error);
      setStatusMessage("");
      toast({
        title: "Failed to connect to Wahoo",
        description: error instanceof Error ? error.message : "Please try again later or contact support.",
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
        {/* Wahoo logo */}
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
