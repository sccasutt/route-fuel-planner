
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Updated to the correct Wahoo API domain
const WAHOO_AUTH_URL = "https://api.wahooligan.com/oauth/authorize";
const REDIRECT_URI = window.location.origin + "/functions/v1/wahoo-oauth"; // Must be whitelisted in Wahoo dev portal
const SCOPE = "user_read workout_read"; // Adjust scopes as needed for your app

export function WahooConnectButton() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Fetch the client ID from our secure edge function with explicit content-type
      const response = await fetch(`/functions/v1/wahoo-oauth/get-client-id`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch client ID: ${response.status}`);
      }
      
      // First check if the response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Unexpected response format: ${contentType}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.clientId) {
        throw new Error("No client ID returned from server");
      }
      
      // Redirect to Wahoo authorization page
      window.location.href =
        `${WAHOO_AUTH_URL}?response_type=code` +
        `&client_id=${encodeURIComponent(data.clientId)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}`;
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
