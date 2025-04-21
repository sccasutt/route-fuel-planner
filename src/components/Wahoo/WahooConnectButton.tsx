
import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WahooLogoIcon, DisconnectIcon } from "./WahooIcons";
import { fetchWahooClientId } from "./WahooApi";
import { useWahooAuthPopup } from "./WahooAuthPopupHook";

// OAuth constants
const WAHOO_AUTH_URL = "https://api.wahooligan.com/oauth/authorize";
const REDIRECT_URI = window.location.origin + "/wahoo-callback"; // Use app domain for callback
const SCOPE = "email power_zones_read workouts_read plans_read routes_read user_read";

export function WahooConnectButton() {
  const { toast } = useToast();

  const {
    isConnecting,
    isConnected,
    disconnect,
  } = useWahooAuthPopup({
    onConnect: () => {},
    onError: () => {},
  });

  const handleConnect = async () => {
    try {
      // No popup: redirect the user!
      const clientId = await fetchWahooClientId();
      const state = Math.random().toString(36).substring(2, 10);
      const authUrl =
        `${WAHOO_AUTH_URL}?response_type=code` +
        `&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}` +
        `&state=${encodeURIComponent(state)}`;
      window.location.href = authUrl;
    } catch (error: any) {
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

  return (
    <div className="flex flex-col gap-2">
      {!isConnected ? (
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleConnect}
        >
          <WahooLogoIcon />
          Connect Wahoo
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="default" className="gap-2" disabled>
            <WahooLogoIcon />
            Wahoo Connected
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
