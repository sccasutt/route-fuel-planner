
import { syncWahooProfileAndRoutes } from "@/components/Wahoo/WahooSyncApi";

export async function syncWahooWithProfile(tokenObj: any) {
  try {
    console.log("Starting Wahoo sync with profile...");
    const result = await syncWahooProfileAndRoutes(tokenObj);
    console.log("Wahoo sync completed successfully");
    return result;
  } catch (error) {
    console.error("Error in Wahoo sync:", error);
    
    // Check if this is a token-related error that might need re-auth
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("token") && errorMessage.includes("invalid")) {
      console.warn("Token appears to be invalid, removing local token");
      localStorage.removeItem("wahoo_token");
      window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
    }
    
    throw error;
  }
}
