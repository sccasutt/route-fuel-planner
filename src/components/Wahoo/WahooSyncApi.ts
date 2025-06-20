
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define better types for the response
export interface WahooSyncResult {
  success: boolean;
  data?: {
    profile?: any;
    routeCount?: number;
    activityCount?: number;
  };
  error?: string;
}

// Function to initiate Wahoo data sync
export async function syncWahooProfileAndRoutes(): Promise<WahooSyncResult> {
  console.log("Syncing Wahoo profile and routes");
  
  try {
    const token = localStorage.getItem("wahoo_token");
    if (!token) {
      console.error("No Wahoo token found, cannot sync");
      return { success: false, error: "No Wahoo token found" };
    }
    
    const tokenData = JSON.parse(token);
    
    // Get current user for logging purposes
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user found");
      return { success: false, error: "User must be logged in to sync" };
    }
    
    console.log("Sending sync request with flattened token structure:", {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      hasWahooUserId: !!tokenData.wahoo_user_id,
      userId: user.id
    });
    
    // Call the Supabase edge function with flattened structure
    const { data, error } = await supabase.functions.invoke('wahoo-sync', {
      method: 'POST',
      body: {
        // Flatten the token data structure - send fields at top level
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        wahoo_user_id: tokenData.wahoo_user_id,
        // Note: user_id will be extracted from JWT, not sent in body
      }
    });
    
    if (error) {
      console.error("Error syncing Wahoo data:", error);
      return { success: false, error: error.message || "Failed to sync Wahoo data" };
    }
    
    console.log("Wahoo data sync completed successfully:", data);
    return { success: true, data };
  } catch (err) {
    console.error("Exception during Wahoo sync:", err);
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { success: false, error: message };
  }
}

// Function to disconnect Wahoo account
export async function disconnectWahooAccount() {
  console.log("Disconnecting Wahoo account");
  
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Call the edge function to handle disconnection
    const { error } = await supabase.functions.invoke('wahoo-oauth', {
      method: 'POST',
      body: {
        action: "disconnect",
        userId: user.id,
      }
    });
    
    if (error) {
      console.error("Error disconnecting Wahoo:", error);
      throw new Error(error.message || "Failed to disconnect Wahoo account");
    }
    
    // Clear local storage token data
    localStorage.removeItem("wahoo_token");
    localStorage.removeItem("wahoo_auth_state");
    
    // Dispatch connection change event
    window.dispatchEvent(new CustomEvent("wahoo_connection_changed", {
      detail: { timestamp: Date.now() }
    }));
    
    console.log("Wahoo account disconnected successfully");
    return { success: true };
  } catch (err) {
    console.error("Exception during Wahoo disconnect:", err);
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    throw new Error(message);
  }
}
