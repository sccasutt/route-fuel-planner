
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { WahooSyncResult } from "@/components/Wahoo/WahooSyncApi";
import { performWahooSync, formatSyncResults } from "./wahooSyncUtils";

export function useWahooSyncHandler() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<WahooSyncResult | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    if (isSyncing) return;
    
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
          detail: { timestamp: Date.now() }
        }));
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Could not sync data from Wahoo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during Wahoo sync:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      
      toast({
        title: "Sync Failed",
        description: message,
        variant: "destructive",
      });
      
      setLastSyncResult({
        success: false,
        error: message
      });
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
