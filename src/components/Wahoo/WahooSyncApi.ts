
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
      throw new Error(error.message || "Failed to sync Wahoo routes");
    }
    
    console.log("Wahoo sync completed successfully");
    return data;
  } catch (err) {
    console.error("Exception during Wahoo sync:", err);
    throw err;
  }
}
