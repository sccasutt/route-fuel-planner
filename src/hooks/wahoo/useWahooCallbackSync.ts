
import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWahooSyncHandler } from "./useWahooSyncHandler";
import { useWahooCallbackNavigation } from "./useWahooCallbackNavigation";
import { processRouteBatch, extractAndStoreRoutePoints } from "@/utils/routeProcessing";
import { supabase } from "@/integrations/supabase/client";
import { WahooSyncResult } from "@/components/Wahoo/WahooSyncApi";

export function useWahooCallbackSync() {
  const { user } = useAuth();
  const { handleSync } = useWahooSyncHandler();
  const { navigateWithSuccess, navigateWithError, navigateToAuth } = useWahooCallbackNavigation();

  const performSync = useCallback(async (setStatus: (s: string) => void, setError: (e: string | null) => void) => {
    // Check if user is authenticated before trying to sync
    if (!user) {
      setStatus("Wahoo connected but not synced. Please log in to sync your data.");
      navigateToAuth();
      return false;
    }

    // Sync profile and rides
    setStatus("Synchronizing your rides...");
    try {
      const result: WahooSyncResult = await handleSync();
      
      // If sync was successful and has route data, trigger background processing
      if (result.success === true && result.data && result.data.routeCount > 0) {
        setStatus("Processing route data and extracting coordinates...");
        
        // Get recently synced routes
        const { data: routes } = await supabase
          .from('routes')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20); // Increased limit to process more routes
          
        if (routes && routes.length > 0) {
          const routeIds = routes.map(route => route.id);
          
          // Process route energy data in background
          processRouteBatch(routeIds).then(({ success, failed }) => {
            console.log(`Processed energy data for ${success} routes, ${failed} failed`);
          });
          
          // Process route points extraction in background
          Promise.all(routeIds.map(id => extractAndStoreRoutePoints(id)))
            .then(results => {
              const successCount = results.filter(Boolean).length;
              console.log(`Extracted and stored point data for ${successCount}/${routeIds.length} routes`);
            });
        }
      }
      
      setStatus("Your Wahoo data has been successfully synchronized!");
      
      console.log("WahooCallback: Sync successful, navigating to dashboard");
      navigateWithSuccess("Your Wahoo account is now connected.");
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error synchronizing rides";
      console.error("Error syncing rides:", errMsg);

      if (
        errMsg.includes("connection") ||
        errMsg.includes("refused") ||
        errMsg.includes("unavailable") ||
        errMsg.includes("timeout")
      ) {
        setStatus("Connected, but Wahoo service is currently unavailable for sync.");
        setError("Wahoo service is currently unavailable. Your connection is established, but your rides couldn't be synchronized. Please try to sync later.");
      } else if (errMsg.includes("must be logged in")) {
        setStatus("Connected, but you need to be logged in to sync your data.");
        setError("Please log in to sync your Wahoo data.");
      } else {
        setStatus("Connected, but your rides couldn't be synchronized.");
        setError(errMsg || "Error synchronizing your rides from Wahoo");
      }

      // Even though sync failed, we still have a valid token, so dispatch the connection event again
      window.dispatchEvent(
        new CustomEvent("wahoo_connection_changed", {
          detail: { timestamp: Date.now() },
        })
      );
      
      navigateWithError("Partial connection", "Connected to Wahoo, but couldn't sync rides. Try again later.");
      return false;
    }
  }, [user, handleSync, navigateWithSuccess, navigateWithError, navigateToAuth]);

  return { performSync };
}
