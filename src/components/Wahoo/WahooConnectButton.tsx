
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

  const {
    isConnected,
    disconnect,
  } = useWahooAuthPopup({
    onConnect: () => {},
    onError: () => {},
  });

  const handleConnect = async () => {
    try {
      const clientId = await fetchWahooClientId();
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("wahoo_auth_state", state);

      const authUrl =
        `${WAHOO_AUTH_URL}?response_type=code` +
        `&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}` +
        `&state=${encodeURIComponent(state)}`;

      window.location.href = authUrl;
    } catch (error) {
      toast({
        title: "Failed to connect to Wahoo",
        description: error?.message ?? "Please try again later or contact support.",
        variant: "destructive",
      });
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
      await syncWahooProfileAndRoutes(token);
      toast({ title: "Wahoo Synced", description: "Rides and profile updated." });
      window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
    } catch (error) {
      toast({
        title: "Failed to resync",
        description: error.message || "Please re-connect to Wahoo.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {!isConnected ? (
        <Button variant="outline" className="gap-2" onClick={handleConnect}>
          <WahooLogoIcon />
          Connect Wahoo
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
