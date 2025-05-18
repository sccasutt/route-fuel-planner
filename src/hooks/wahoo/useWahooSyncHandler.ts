
import { syncWahooWithProfile } from "./wahooSyncUtils";
import { useToast } from "@/hooks/use-toast";

interface SyncOptions {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  wahoo_user_id?: string | null;
}

export function useWahooSyncHandler() {
  const { toast } = useToast();

  const syncWahooData = async (options: SyncOptions) => {
    try {
      console.log("Starting Wahoo sync with handler", {
        hasAccessToken: !!options.access_token,
        hasRefreshToken: !!options.refresh_token,
        hasWahooUserId: !!options.wahoo_user_id,
        expiresAt: options.expires_at
      });
      
      const result = await syncWahooWithProfile(options);
      
      console.log("Wahoo sync completed successfully via handler", {
        profileFound: !!result?.profile,
        routeCount: result?.routeCount || 0,
        activityCount: result?.activityCount || 0
      });
      
      // Show success toast with route count
      if (result?.routeCount) {
        toast({
          title: "Wahoo Sync Complete",
          description: `Successfully synced ${result.routeCount} routes from your Wahoo account.`,
          variant: "default"
        });
      }
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error("Error in Wahoo sync handler:", error);
      
      // Get readable error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Determine if this is a token-related error requiring re-auth
      if (errorMessage.includes("token") && errorMessage.includes("invalid")) {
        console.warn("Token appears to be invalid via handler, removing local token");
        localStorage.removeItem("wahoo_token");
        window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
        
        toast({
          title: "Wahoo Connection Issue",
          description: "Your Wahoo connection has expired. Please reconnect.",
          variant: "destructive"
        });
      } else {
        // Generic error toast
        toast({
          title: "Sync Failed",
          description: errorMessage || "Failed to sync with Wahoo",
          variant: "destructive"
        });
      }
      
      return {
        success: false,
        error
      };
    }
  };

  return {
    syncWahooData
  };
}
