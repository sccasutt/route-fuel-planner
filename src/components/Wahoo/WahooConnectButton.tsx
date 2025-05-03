
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WahooLogoIcon, DisconnectIcon } from "./WahooIcons";
import { fetchWahooClientId } from "./WahooApi";
import { useWahooAuthPopup } from "./WahooAuthPopupHook";
import { WahooErrorAlert } from "./WahooErrorAlert";
import { WahooResyncButton } from "./WahooResyncButton";
import { useWahooRedirectUri } from "@/hooks/wahoo/useWahooRedirectUri";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const WAHOO_AUTH_URL = "https://api.wahooligan.com/oauth/authorize";
const SCOPE = "email power_zones_read workouts_read plans_read routes_read user_read";

export function WahooConnectButton() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [instanceId] = useState(`connect-btn-${Math.random().toString(36).substring(2, 9)}`);
  const redirectUri = useWahooRedirectUri();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    isConnected,
    disconnect,
  } = useWahooAuthPopup({
    onConnect: () => {
      setConnectionError(null);
    },
    onError: (error) => {
      setConnectionError(error);
    },
  });

  useEffect(() => {
    console.log(`[${instanceId}] Connection state changed:`, isConnected);
  }, [isConnected, instanceId]);

  const handleConnect = async () => {
    // Check if user is logged in first
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in before connecting your Wahoo account.",
      });
      navigate("/auth");
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError(null);
      
      localStorage.removeItem("wahoo_token");
      localStorage.removeItem("wahoo_auth_state");
      
      const clientId = await fetchWahooClientId();
      if (!clientId) {
        throw new Error("Could not retrieve Wahoo Client ID");
      }
      
      const stateArray = new Uint8Array(16);
      window.crypto.getRandomValues(stateArray);
      const state = Array.from(stateArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const stateData = {
        value: state,
        created: Date.now()
      };
      localStorage.setItem("wahoo_auth_state", JSON.stringify(stateData));
      
      console.log(`[${instanceId}] Using redirect URI:`, redirectUri);
      
      const authUrl = new URL(WAHOO_AUTH_URL);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("client_id", clientId);
      authUrl.searchParams.append("redirect_uri", redirectUri);
      authUrl.searchParams.append("scope", SCOPE);
      authUrl.searchParams.append("state", state);
      
      console.log(`[${instanceId}] Redirecting to Wahoo auth URL:`, authUrl.toString());
      
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
        <Button 
          variant="outline" 
          className="gap-2 wahoo-connect-button" 
          onClick={handleConnect} 
          disabled={isConnecting}
        >
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
