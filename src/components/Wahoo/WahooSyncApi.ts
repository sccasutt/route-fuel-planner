
import { supabase } from "@/integrations/supabase/client";

export async function syncWahooProfileAndRoutes(tokenObj: { 
  access_token: string; 
  refresh_token: string;
  wahoo_user_id?: string | null;
}) {
  try {
    console.log("Initiating Wahoo sync with token:", {
      hasAccessToken: !!tokenObj.access_token,
      hasRefreshToken: !!tokenObj.refresh_token,
      hasWahooUserId: !!tokenObj.wahoo_user_id
    });
    
    // First, get the current user's ID to ensure proper linking
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData || !authData.user || !authData.user.id) {
      console.error("No authenticated user found for Wahoo sync");
      throw new Error("You must be logged in to sync Wahoo data");
    }
    
    const userId = authData.user.id;
    console.log("Syncing Wahoo data for user ID:", userId);
    
    if (!tokenObj.wahoo_user_id) {
      console.warn("Warning: No Wahoo user ID provided for sync operation");
    }
    
    // Send both the user ID and Wahoo token data to the sync function
    const { data, error } = await supabase.functions.invoke("wahoo-sync", {
      method: "POST",
      body: {
        ...tokenObj,
        user_id: userId, // Explicitly passing the user ID to ensure correct association
      },
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (error) {
      console.error("Error syncing Wahoo data:", error);
      
      // Enhanced error detection for various connection errors
      if (error.message?.includes("connection") || 
          error.message?.includes("timeout") ||
          error.message?.includes("timed out") ||
          error.message?.toLowerCase().includes("unavailable")) {
        throw new Error("Connection to Wahoo service failed. The service may be temporarily unavailable.");
      }
      
      throw new Error(error.message || "Error synchronizing with Wahoo");
    }
    
    if (!data || (data.error && typeof data.error === 'string')) {
      console.error("Wahoo sync returned an error response:", data);
      throw new Error(data.error || "Error in Wahoo sync response");
    }
    
    console.log("Wahoo sync completed successfully:", data);
    return data;
  } catch (err) {
    console.error("Exception during Wahoo sync:", err);
    
    // Enhanced error detection for the caught exception
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    if (errorMessage.includes("connection") || 
        errorMessage.includes("timeout") ||
        errorMessage.includes("timed out") ||
        errorMessage.toLowerCase().includes("unavailable")) {
      throw new Error("Connection to Wahoo service failed. The service may be temporarily unavailable.");
    }
    
    throw err;
  }
}
