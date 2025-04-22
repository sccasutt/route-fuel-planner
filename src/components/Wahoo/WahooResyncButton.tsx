
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { syncWahooProfileAndRoutes } from "./WahooSyncApi";
import { useAuth } from "@/hooks/useAuth";

interface WahooResyncButtonProps {
  setConnectionError: (v: string | null) => void;
}

export function WahooResyncButton({ setConnectionError }: WahooResyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth(); // Added user check

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
      
      // Explicitly log we have an auth session before syncing
      console.log("Starting Wahoo sync with authenticated user:", user.id);

      await syncWahooProfileAndRoutes(token);

      toast({ 
        title: "Wahoo Synced", 
        description: "Your rides and profile have been updated." 
      });

      window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
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
    <Button variant="secondary" size="sm" onClick={handleResync} disabled={isSyncing}>
      {isSyncing ? "Syncing..." : "Resync"}
    </Button>
  );
}
