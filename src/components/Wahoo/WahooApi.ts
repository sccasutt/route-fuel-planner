
import { supabase } from "@/integrations/supabase/client";

export async function fetchWahooClientId() {
  console.log("Fetching Wahoo client ID...");
  try {
    const { data, error } = await supabase.functions.invoke('wahoo-oauth/get-client-id', {
      method: 'GET'
    });
    
    if (error) {
      console.error("Error fetching Wahoo client ID:", error);
      throw new Error(error.message || "Failed to get Wahoo Client ID");
    }
    
    if (!data || !data.clientId) {
      console.error("No client ID returned from server:", data);
      throw new Error("No client ID returned from server");
    }
    
    console.log("Successfully fetched Wahoo client ID");
    return data.clientId;
  } catch (err) {
    console.error("Exception fetching Wahoo client ID:", err);
    throw err;
  }
}
