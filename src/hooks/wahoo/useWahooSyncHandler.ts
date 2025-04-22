
import { syncWahooWithProfile } from "./wahooSyncUtils";

interface SyncOptions {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  wahoo_user_id?: string | null;
}

export function useWahooSyncHandler() {
  const syncWahooData = async (options: SyncOptions) => {
    try {
      console.log("Starting Wahoo sync with handler", {
        hasAccessToken: !!options.access_token,
        hasRefreshToken: !!options.refresh_token,
        hasWahooUserId: !!options.wahoo_user_id,
        expiresAt: options.expires_at
      });
      
      const result = await syncWahooWithProfile(options);
      console.log("Wahoo sync completed successfully via handler");
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error("Error in Wahoo sync handler:", error);
      
      // Determine if this is a token-related error requiring re-auth
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("token") && errorMessage.includes("invalid")) {
        console.warn("Token appears to be invalid via handler, removing local token");
        localStorage.removeItem("wahoo_token");
        window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
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
