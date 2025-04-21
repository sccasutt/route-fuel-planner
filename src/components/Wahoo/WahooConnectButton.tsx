
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WahooLogoIcon, DisconnectIcon } from "./WahooIcons";
import { fetchWahooClientId } from "./WahooApi";
import { useWahooAuthPopup } from "./WahooAuthPopupHook";
import { syncWahooProfileAndRoutes } from "./WahooSyncApi";

const WAHOO_AUTH_URL = "https://api.wahooligan.com/oauth/authorize";
const REDIRECT_URI = `${window.location.origin}/wahoo-callback`;
const SCOPE = "email power_zones_read workouts_read plans_read routes_read user_read";

export function WahooConnectButton() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const {
    isConnected,
    disconnect,
  } = useWahooAuthPopup({
    onConnect: () => {},
    onError: () => {},
  });

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      console.log("Initiating Wahoo connection flow");
      const clientId = await fetchWahooClientId();
      
      if (!clientId) {
        throw new Error("Could not retrieve Wahoo client ID");
      }
      
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("wahoo_auth_state", state);

      const authUrl =
        `${WAHOO_AUTH_URL}?response_type=code` +
        `&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}` +
        `&state=${encodeURIComponent(state)}`;

      console.log("Redirecting to Wahoo authorization URL");
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error initiating Wahoo connection:", error);
      toast({
        title: "Failed to connect to Wahoo",
        description: error?.message ?? "Please try again later or contact support.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Wahoo Disconnected",
      description: "Your Wahoo account has been disconnected.",
    });
  };

  const handleResync = async () => {
    setIsSyncing(true);
    try {
      const wahooTokenString = localStorage.getItem("wahoo_token");
      if (!wahooTokenString) throw new Error("No Wahoo token present");
      
      const token = JSON.parse(wahooTokenString);
      console.log("Starting resync with Wahoo");
      
      await syncWahooProfileAndRoutes(token);
      
      toast({ 
        title: "Wahoo Synced", 
        description: "Rides and profile updated." 
      });
      
      window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
    } catch (error) {
      console.error("Error during Wahoo resync:", error);
      
      // Handle specific API rejection errors
      const errorMsg = error?.message || "";
      let description = "Please re-connect to Wahoo.";
      
      if (errorMsg.includes("Connection error") || errorMsg.includes("die Verbindung abgelehnt")) {
        description = "Connection to Wahoo API failed. Please try again later when the service is available.";
      } else if (errorMsg.includes("token")) {
        description = "Your Wahoo session has expired. Please reconnect.";
        // Clear invalid token
        localStorage.removeItem("wahoo_token");
        window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
      }
      
      toast({
        title: "Failed to resync",
        description: description,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {!isConnected ? (
        <Button variant="outline" className="gap-2" onClick={handleConnect} disabled={isConnecting}>
          <WahooLogoIcon />
          {isConnecting ? "Connecting..." : "Connect Wahoo"}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="default" className="gap-2" disabled>
            <WahooLogoIcon />
            Wahoo Connected
          </Button>
          <Button variant="secondary" size="sm" onClick={handleResync} disabled={isSyncing}>
            {isSyncing ? "Syncing..." : "Resync"}
          </Button>
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
