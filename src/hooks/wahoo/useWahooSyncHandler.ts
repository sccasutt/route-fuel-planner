
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { WahooSyncResult } from "@/components/Wahoo/WahooSyncApi";
import { performWahooSync } from "./wahooSyncUtils";
import { useAuth } from "@/hooks/useAuth";

export function useWahooSyncHandler() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<WahooSyncResult | null>(null);
  const { toast } = useToast();
  const { user } = useAuth(); // Get the authenticated user

  const handleSync = async (): Promise<WahooSyncResult> => {
    if (isSyncing) {
      return { success: false, error: "Sync already in progress" };
    }
    
    // Check if user is authenticated
    if (!user) {
      return { success: false, error: "User must be logged in to sync Wahoo data" };
    }
    
    setIsSyncing(true);
    try {
      const result = await performWahooSync();
      setLastSyncResult(result);
      
      if (result.success && result.data) {
        // Check if we received profile, routes, or activities
        const hasProfile = !!result.data.profile;
        const routes = result.data.routeCount || 0;
        const activities = result.data.activityCount || 0;
        
        let description = "Your Wahoo data has been synced.";
        
        if (routes > 0) {
          description = `${routes} route${routes !== 1 ? 's' : ''} synced from Wahoo.`;
        }
        
        toast({
          title: "Sync Successful",
          description,
          variant: "default",
        });
        
        // Dispatch event to notify other components about the sync
        window.dispatchEvent(new CustomEvent("wahoo_connection_changed", {
          detail: { timestamp: Date.now(), userId: user.id }
        }));
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Could not sync data from Wahoo",
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      console.error("Error during Wahoo sync:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      
      toast({
        title: "Sync Failed",
        description: message,
        variant: "destructive",
      });
      
      const errorResult: WahooSyncResult = {
        success: false,
        error: message
      };
      
      setLastSyncResult(errorResult);
      return errorResult;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    handleSync,
    isSyncing,
    lastSyncResult
  };
}
