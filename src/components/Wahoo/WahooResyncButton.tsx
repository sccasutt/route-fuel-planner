
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { syncWahooProfileAndRoutes } from "./WahooSyncApi";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, Bike } from "lucide-react";

interface WahooResyncButtonProps {
  setConnectionError: (v: string | null) => void;
  variant?: "default" | "secondary" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  label?: string;
}

export function WahooResyncButton({ 
  setConnectionError, 
  variant = "secondary", 
  size = "sm", 
  showIcon = true,
  label = "Resync"
}: WahooResyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleResync = async () => {
    setIsSyncing(true);
    setConnectionError(null);
    try {
      // First check if user is logged in
      if (!user) {
        throw new Error("You must be logged in to sync Wahoo data");
      }

      const wahooTokenString = localStorage.getItem("wahoo_token");
      if (!wahooTokenString) throw new Error("No Wahoo token found");
      
      const token = JSON.parse(wahooTokenString);
      
      // Validate token
      if (!token.access_token || !token.refresh_token) {
        throw new Error("Invalid Wahoo token structure");
      }
      
      // Explicitly log we have an auth session before syncing
      console.log("Starting Wahoo sync with authenticated user:", user.id);
      console.log("Token data for sync:", {
        hasAccessToken: !!token.access_token,
        hasRefreshToken: !!token.refresh_token,
        hasWahooUserId: !!token.wahoo_user_id,
        expiresAt: token.expires_at ? new Date(token.expires_at).toISOString() : 'none'
      });

      // Check token expiration
      if (token.expires_at && token.expires_at < Date.now()) {
        console.warn("Wahoo token has expired, consider refreshing");
        // Continue anyway as the token might still work or the server might refresh it
      }

      // Sync with Wahoo
      const result = await syncWahooProfileAndRoutes(token);
      
      if (!result) {
        throw new Error("No response from Wahoo sync");
      }

      toast({ 
        title: "Wahoo Synced", 
        description: "Your rides and profile have been updated." 
      });

      // Notify other components that connection status may have changed
      window.dispatchEvent(new CustomEvent("wahoo_connection_changed", {
        detail: { timestamp: Date.now() }
      }));
      
      // Force reload to make sure we see the latest data
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("Wahoo sync error:", errorMsg);
      console.error("Full error:", error);
      
      let description = "Please reconnect to Wahoo.";
      let clearToken = false;

      if (
        errorMsg.includes("connection") ||
        errorMsg.includes("unavailable") ||
        errorMsg.includes("timeout") ||
        errorMsg.includes("refused")
      ) {
        description = "The Wahoo service is currently unavailable. Please try again later.";
        setConnectionError("The Wahoo service is currently unavailable. Please try again later.");
      } else if (errorMsg.includes("token")) {
        description = "Your Wahoo session has expired. Please reconnect.";
        clearToken = true;
      } else if (errorMsg.includes("must be logged in")) {
        description = "You need to log in to sync your Wahoo data.";
        setConnectionError("Please log in to sync your Wahoo data.");
      } else {
        // Generic error
        setConnectionError(errorMsg || "Failed to sync with Wahoo. Please try reconnecting.");
      }

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
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleResync} 
      disabled={isSyncing}
      className={showIcon ? "gap-2" : ""}
    >
      {showIcon && (isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bike className="h-4 w-4" />)}
      {isSyncing ? "Syncing..." : label}
    </Button>
  );
}
