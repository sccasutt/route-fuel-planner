
import { supabase } from "@/integrations/supabase/client";

export async function syncWahooProfileAndRoutes(tokenObj: { access_token: string; refresh_token: string }) {
  try {
    console.log("Initiating Wahoo sync with token");
    
    const { data, error } = await supabase.functions.invoke("wahoo-sync", {
      method: "POST",
      body: tokenObj,
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
    
    console.log("Wahoo sync completed successfully:", data);
    return data;
  } catch (err) {
    console.error("Exception during Wahoo sync:", err);
    
    // Enhanced error detection for the caught exception
    const errorMessage = err.message || "";
    if (errorMessage.includes("connection") || 
        errorMessage.includes("timeout") ||
        errorMessage.includes("timed out") ||
        errorMessage.toLowerCase().includes("unavailable")) {
      throw new Error("Connection to Wahoo service failed. The service may be temporarily unavailable.");
    }
    
    throw err;
  }
}
