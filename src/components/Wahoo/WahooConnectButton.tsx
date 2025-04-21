
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WahooLogoIcon, DisconnectIcon } from "./WahooIcons";
import { fetchWahooClientId } from "./WahooApi";
import { useWahooAuthPopup } from "./WahooAuthPopupHook";
import { syncWahooProfileAndRoutes } from "./WahooSyncApi";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// Using constants for URLs to ensure consistency
const WAHOO_AUTH_URL = "https://api.wahooligan.com/oauth/authorize";
const REDIRECT_URI = `${window.location.origin}/wahoo-callback`;
const SCOPE = "email power_zones_read workouts_read plans_read routes_read user_read";

export function WahooConnectButton() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const {
    isConnected,
    disconnect,
  } = useWahooAuthPopup({
    onConnect: () => {
      console.log("WahooConnectButton: Connection successful");
      setConnectionError(null);
      toast({
        title: "Wahoo Connected",
        description: "Your Wahoo account is now connected."
      });
    },
    onError: (error) => {
      console.error("WahooConnectButton: Connection error", error);
      setConnectionError(error);
    },
  });

  // Debug log for connection state
  useEffect(() => {
    console.log("WahooConnectButton: Connection state changed:", isConnected);
  }, [isConnected]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);
      console.log("Initiating Wahoo connection flow");
      
      // Clean up any previous connection attempts
      localStorage.removeItem("wahoo_token");
      localStorage.removeItem("wahoo_auth_state");
      
      // Fetch the client ID from the edge function
      const clientId = await fetchWahooClientId();
      
      if (!clientId) {
        throw new Error("Could not retrieve Wahoo Client ID");
      }
      
      console.log("Retrieved client ID successfully");
      
      // Generate and store state parameter for CSRF protection
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("wahoo_auth_state", state);
      console.log("Stored auth state:", state);

      // Build the complete authorization URL 
      const authUrl =
        `${WAHOO_AUTH_URL}?response_type=code` +
        `&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}` +
        `&state=${encodeURIComponent(state)}`;

      console.log("Redirecting to Wahoo authorization URL:", authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error initiating Wahoo connection:", error);
      
      // Check for connection errors and set appropriate message
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      if (errorMsg.includes("connection") ||
          errorMsg.includes("timeout") ||
          errorMsg.includes("refused")) {
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

  const handleResync = async () => {
    setIsSyncing(true);
    setConnectionError(null);
    try {
      const wahooTokenString = localStorage.getItem("wahoo_token");
      if (!wahooTokenString) throw new Error("No Wahoo token found");
      
      const token = JSON.parse(wahooTokenString);
      console.log("Starting resync with Wahoo");
      
      await syncWahooProfileAndRoutes(token);
      
      toast({ 
        title: "Wahoo Synced", 
        description: "Your rides and profile have been updated." 
      });
      
      window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
    } catch (error) {
      console.error("Error during Wahoo resync:", error);
      
      // Enhanced error handling for connection issues
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      let description = "Please reconnect to Wahoo.";
      let clearToken = false;
      
      if (errorMsg.includes("connection") ||
          errorMsg.includes("unavailable") ||
          errorMsg.includes("timeout") ||
          errorMsg.includes("refused")) {
        description = "The Wahoo service is currently unavailable. Please try again later.";
        setConnectionError("The Wahoo service is currently unavailable. Please try again later.");
      } else if (errorMsg.includes("token")) {
        description = "Your Wahoo session has expired. Please reconnect.";
        clearToken = true;
      }
      
      // Only clear token if it's an authentication issue, not for temporary connection problems
      if (clearToken) {
        localStorage.removeItem("wahoo_token");
        localStorage.removeItem("wahoo_auth_state");
        window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
      }
      
      toast({
        title: "Sync Failed",
        description: description,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {connectionError && (
        <Alert variant="destructive" className="mb-2">
          <AlertTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Connection Error
          </AlertTitle>
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      )}
      
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
