
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
      // Removed invalid timeout option
    });

    if (error) {
      console.error("Error syncing Wahoo data:", error);
      
      // Enhanced error detection for various connection errors including German error messages
      if (error.message?.includes("connection") || 
          error.message?.includes("Verbindung") ||
          error.message?.includes("abgelehnt") ||
          error.message?.includes("timeout") ||
          error.message?.includes("timed out") ||
          error.message?.toLowerCase().includes("unavailable")) {
        throw new Error("Die Verbindung zum Wahoo-Dienst ist fehlgeschlagen. Der Dienst ist möglicherweise vorübergehend nicht verfügbar.");
      }
      
      throw new Error(error.message || "Fehler bei der Synchronisation mit Wahoo");
    }
    
    console.log("Wahoo sync completed successfully");
    return data;
  } catch (err) {
    console.error("Exception during Wahoo sync:", err);
    
    // Enhanced error detection for the caught exception
    const errorMessage = err.message || "";
    if (errorMessage.includes("connection") || 
        errorMessage.includes("Verbindung") ||
        errorMessage.includes("abgelehnt") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("timed out") ||
        errorMessage.toLowerCase().includes("unavailable")) {
      throw new Error("Die Verbindung zum Wahoo-Dienst ist fehlgeschlagen. Der Dienst ist möglicherweise vorübergehend nicht verfügbar.");
    }
    
    throw err;
  }
}
