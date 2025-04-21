
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WahooLogoIcon, DisconnectIcon } from "./WahooIcons";
import { fetchWahooClientId } from "./WahooApi";
import { useWahooAuthPopup } from "./WahooAuthPopupHook";
import { WahooErrorAlert } from "./WahooErrorAlert";
import { WahooResyncButton } from "./WahooResyncButton";

const WAHOO_AUTH_URL = "https://api.wahooligan.com/oauth/authorize";
const REDIRECT_URI = window.location.origin + "/wahoo-callback";
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
      localStorage.removeItem("wahoo_token");
      localStorage.removeItem("wahoo_auth_state");
      const clientId = await fetchWahooClientId();
      if (!clientId) {
        throw new Error("Could not retrieve Wahoo Client ID");
      }
      // More random/secure state parameter
      const stateArray = new Uint8Array(24);
      window.crypto.getRandomValues(stateArray);
      const state = Array.from(stateArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const stateData = {
        value: state,
        created: Date.now()
      };
      localStorage.setItem("wahoo_auth_state", JSON.stringify(stateData));
      const authUrl =
        `${WAHOO_AUTH_URL}?response_type=code` +
        `&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}` +
        `&state=${encodeURIComponent(state)}`;

      window.location.href = authUrl;
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
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
