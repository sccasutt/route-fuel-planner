
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WahooLogoIcon, DisconnectIcon } from "./WahooIcons";
import { fetchWahooClientId } from "./WahooApi";
import { useWahooAuthPopup } from "./WahooAuthPopupHook";
import { syncWahooProfileAndRoutes } from "./WahooSyncApi";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

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
      setConnectionError(null);
    },
    onError: () => {},
  });

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);
      console.log("Initiating Wahoo connection flow");
      
      const clientId = await fetchWahooClientId();
      
      if (!clientId) {
        throw new Error("Die Client-ID für Wahoo konnte nicht abgerufen werden");
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
      
      // Check for connection errors and set appropriate message
      const errorMsg = error?.message || "";
      if (errorMsg.includes("Verbindung") || 
          errorMsg.includes("abgelehnt") ||
          errorMsg.includes("connection") ||
          errorMsg.includes("timeout")) {
        setConnectionError("Der Wahoo-Dienst ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.");
      } else {
        setConnectionError(errorMsg || "Verbindung zu Wahoo fehlgeschlagen");
      }
      
      toast({
        title: "Verbindung zu Wahoo fehlgeschlagen",
        description: errorMsg || "Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setConnectionError(null);
    toast({
      title: "Wahoo getrennt",
      description: "Ihre Wahoo-Verbindung wurde getrennt.",
    });
  };

  const handleResync = async () => {
    setIsSyncing(true);
    setConnectionError(null);
    try {
      const wahooTokenString = localStorage.getItem("wahoo_token");
      if (!wahooTokenString) throw new Error("Kein Wahoo-Token vorhanden");
      
      const token = JSON.parse(wahooTokenString);
      console.log("Starting resync with Wahoo");
      
      await syncWahooProfileAndRoutes(token);
      
      toast({ 
        title: "Wahoo synchronisiert", 
        description: "Ihre Fahrten und Ihr Profil wurden aktualisiert." 
      });
      
      window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
    } catch (error) {
      console.error("Error during Wahoo resync:", error);
      
      // Enhanced error handling for connection issues
      const errorMsg = error?.message || "";
      let description = "Bitte verbinden Sie sich erneut mit Wahoo.";
      let clearToken = false;
      
      if (errorMsg.includes("Verbindung") || 
          errorMsg.includes("abgelehnt") ||
          errorMsg.includes("nicht verfügbar") ||
          errorMsg.includes("connection") ||
          errorMsg.includes("unavailable") ||
          errorMsg.includes("timeout")) {
        description = "Der Wahoo-Dienst ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.";
        setConnectionError("Der Wahoo-Dienst ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.");
      } else if (errorMsg.includes("token")) {
        description = "Ihre Wahoo-Sitzung ist abgelaufen. Bitte verbinden Sie sich erneut.";
        clearToken = true;
      }
      
      // Only clear token if it's an authentication issue, not for temporary connection problems
      if (clearToken) {
        localStorage.removeItem("wahoo_token");
        window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
      }
      
      toast({
        title: "Synchronisation fehlgeschlagen",
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
            <ExclamationTriangleIcon className="h-4 w-4" />
            Verbindungsfehler
          </AlertTitle>
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      )}
      
      {!isConnected ? (
        <Button variant="outline" className="gap-2" onClick={handleConnect} disabled={isConnecting}>
          <WahooLogoIcon />
          {isConnecting ? "Verbinden..." : "Mit Wahoo verbinden"}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="default" className="gap-2" disabled>
            <WahooLogoIcon />
            Mit Wahoo verbunden
          </Button>
          <Button variant="secondary" size="sm" onClick={handleResync} disabled={isSyncing}>
            {isSyncing ? "Synchronisiere..." : "Neu synchronisieren"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDisconnect}
            title="Wahoo-Verbindung trennen"
          >
            <DisconnectIcon />
          </Button>
        </div>
      )}
    </div>
  );
}
