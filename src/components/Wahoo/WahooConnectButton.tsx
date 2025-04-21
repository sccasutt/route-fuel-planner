
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WahooLogoIcon, DisconnectIcon } from "./WahooIcons";
import { fetchWahooClientId } from "./WahooApi";
import { useWahooAuthPopup } from "./WahooAuthPopupHook";

// For Wahoo API integration
const WAHOO_AUTH_URL = "https://api.wahooligan.com/oauth/authorize";
const REDIRECT_URI = "https://jxouzttcjpmmtclagbob.supabase.co/functions/v1/wahoo-oauth";
const SCOPE = "email power_zones_read workouts_read plans_read routes_read user_read";

export function WahooConnectButton() {
  const { toast } = useToast();

  const {
    isConnecting,
    setIsConnecting,
    statusMessage,
    setStatusMessage,
    isConnected,
    setIsConnected,
    authWindow,
    setAuthWindow,
    disconnect,
  } = useWahooAuthPopup({
    onConnect: () => {
      console.log("WahooConnectButton: Connection successful callback");
      toast({
        title: "Wahoo Connected",
        description: "Your Wahoo account was successfully connected!",
        variant: "success",
      });
      
      // Force a refresh of the UI
      setTimeout(() => {
        console.log("WahooConnectButton: Dispatching wahoo_connection_changed event");
        window.dispatchEvent(new CustomEvent('wahoo_connection_changed'));
      }, 100);
    },
    onError: (description) => {
      console.error("WahooConnectButton: Connection error:", description);
      toast({
        title: "Connection Failed",
        description,
        variant: "destructive",
      });
    },
  });

  // Debug - add console logs to help debug connection issues
  useEffect(() => {
    console.log("WahooConnectButton: Connection status:", isConnected);
    console.log("WahooConnectButton: localStorage has token:", !!localStorage.getItem("wahoo_token"));
  }, [isConnected]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setStatusMessage("Fetching client ID...");
      console.log("WahooConnectButton: Starting connection flow");
      
      const clientId = await fetchWahooClientId();
      console.log("WahooConnectButton: Received client ID");

      setStatusMessage("Opening authorization window...");

      // Generate a random state for security
      const state = Math.random().toString(36).substring(2, 10);

      const authUrl =
        `${WAHOO_AUTH_URL}?response_type=code` +
        `&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}` +
        `&state=${encodeURIComponent(state)}`;
      
      console.log("Opening Wahoo auth URL:", authUrl);
      
      const popupWidth = 800;
      const popupHeight = 700;
      const left = window.innerWidth / 2 - popupWidth / 2;
      const top = window.innerHeight / 2 - popupHeight / 2;

      const popup = window.open(
        authUrl,
        "WahooAuthPopup",
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,resizable=yes`
      );
      
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        console.error("WahooConnectButton: Popup blocked");
        setIsConnecting(false);
        setStatusMessage("");
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("WahooConnectButton: Auth popup opened");
      setAuthWindow(popup);
      popup.focus();

      setTimeout(() => {
        if (isConnecting) {
          console.log("WahooConnectButton: Connection timeout");
          setIsConnecting(false);
          setStatusMessage("");
          toast({
            title: "Connection timeout",
            description: "The connection process took too long. Please try again.",
            variant: "destructive",
          });
          if (popup && !popup.closed) popup.close();
        }
      }, 120000);
    } catch (error: any) {
      console.error("Error connecting to Wahoo:", error);
      setStatusMessage("");
      toast({
        title: "Failed to connect to Wahoo",
        description: error?.message ?? "Please try again later or contact support.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    console.log("WahooConnectButton: Disconnecting Wahoo");
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
          disabled={isConnecting}
        >
          <WahooLogoIcon />
          {isConnecting ? "Connecting..." : "Connect Wahoo"}
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
      {statusMessage && (
        <p className="text-xs text-muted-foreground">{statusMessage}</p>
      )}
    </div>
  );
}
