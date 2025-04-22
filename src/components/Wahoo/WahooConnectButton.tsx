
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WahooLogoIcon, DisconnectIcon } from "./WahooIcons";
import { fetchWahooClientId } from "./WahooApi";
import { useWahooAuthPopup } from "./WahooAuthPopupHook";
import { WahooErrorAlert } from "./WahooErrorAlert";
import { WahooResyncButton } from "./WahooResyncButton";

const WAHOO_AUTH_URL = "https://api.wahooligan.com/oauth/authorize";
// Make sure this exactly matches what's configured in Wahoo
const REDIRECT_URI = "https://www.pedalplate.food/wahoo-callback";
const SCOPE = "email power_zones_read workouts_read plans_read routes_read user_read";

export function WahooConnectButton() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [instanceId] = useState(`connect-btn-${Math.random().toString(36).substring(2, 9)}`);

  const {
    isConnected,
    disconnect,
  } = useWahooAuthPopup({
    onConnect: () => {
      setConnectionError(null);
      // Do not show toast here, it causes duplicate toasts due to event handling
    },
    onError: (error) => {
      setConnectionError(error);
    },
  });

  useEffect(() => {
    // Debug log for connection state
    console.log(`[${instanceId}] Connection state changed:`, isConnected);
  }, [isConnected, instanceId]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);
      
      // Clean up any existing token data to ensure fresh state
      localStorage.removeItem("wahoo_token");
      localStorage.removeItem("wahoo_auth_state");
      
      const clientId = await fetchWahooClientId();
      if (!clientId) {
        throw new Error("Could not retrieve Wahoo Client ID");
      }
      
      // Generate a secure state value for CSRF protection
      const stateArray = new Uint8Array(16);
      window.crypto.getRandomValues(stateArray);
      const state = Array.from(stateArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Store the state with timestamp
      const stateData = {
        value: state,
        created: Date.now()
      };
      localStorage.setItem("wahoo_auth_state", JSON.stringify(stateData));
      
      // Print actual redirect URI for debugging
      console.log(`[${instanceId}] Configured redirect URI:`, REDIRECT_URI);
      
      // Construct authentication URL with proper encoding
      const authUrl = new URL(WAHOO_AUTH_URL);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("client_id", clientId);
      authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.append("scope", SCOPE);
      authUrl.searchParams.append("state", state);
      
      // Print final constructed URL for debugging
      console.log(`[${instanceId}] Redirecting to Wahoo auth URL:`, authUrl.toString());
      
      // Redirect to the authorization URL
      window.location.href = authUrl.toString();
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[${instanceId}] Wahoo connection error:`, errorMsg);
      
      if (
        errorMsg.includes("connection") ||
        errorMsg.includes("timeout") ||
        errorMsg.includes("refused")
      ) {
        setConnectionError("The Wahoo service is currently unavailable. Please try again later.");
      } else {
        setConnectionError(errorMsg || "Failed to connect to Wahoo");
      }
      
      toast({
        title: "Failed to connect to Wahoo",
        description: errorMsg || "Please try again later.",
        variant: "destructive",
      });
      
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setConnectionError(null);
    toast({
      title: "Wahoo Disconnected",
      description: "Your Wahoo connection has been disconnected.",
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <WahooErrorAlert connectionError={connectionError} />

      {!isConnected ? (
        <Button variant="outline" className="gap-2" onClick={handleConnect} disabled={isConnecting}>
          <WahooLogoIcon />
          {isConnecting ? "Connecting..." : "Connect to Wahoo"}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="default" className="gap-2" disabled>
            <WahooLogoIcon />
            Connected to Wahoo
          </Button>
          <WahooResyncButton setConnectionError={setConnectionError} />
          <Button
            variant="outline"
            size="icon"
            onClick={handleDisconnect}
            title="Disconnect Wahoo"
          >
            <DisconnectIcon />
          </Button>
        </div>
      )}
    </div>
  );
}
