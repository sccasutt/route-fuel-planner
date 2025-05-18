
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
      hasWahooUserId: !!tokenObj.wahoo_user_id,
      wahooUserId: tokenObj.wahoo_user_id
    });
    
    // First, get the current user's ID to ensure proper linking
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("Error getting authenticated user:", authError);
      throw new Error("Authentication error: " + authError.message);
    }
    
    if (!authData || !authData.user || !authData.user.id) {
      console.error("No authenticated user found for Wahoo sync");
      throw new Error("You must be logged in to sync Wahoo data");
    }
    
    const userId = authData.user.id;
    console.log("Syncing Wahoo data for user ID:", userId);
    
    // Create request body with all required fields
    const requestBody = {
      access_token: tokenObj.access_token,
      refresh_token: tokenObj.refresh_token,
      wahoo_user_id: tokenObj.wahoo_user_id || null,
      user_id: userId
    };

    // Log the complete request body for debugging (excluding tokens)
    const debugBody = {
      ...requestBody,
      access_token: !!requestBody.access_token ? "present" : "missing",
      refresh_token: !!requestBody.refresh_token ? "present" : "missing"
    };
    console.log("Debug - Request body before sending:", debugBody);

    // Call the Supabase Edge Function
    console.log("Invoking wahoo-sync function");
    const { data, error } = await supabase.functions.invoke("wahoo-sync", {
      method: 'POST',
      body: requestBody
    });

    if (error) {
      console.error("Error from Supabase Edge Function:", error);
      throw new Error(`Supabase function error: ${error.message}`);
    }
    
    if (!data) {
      console.error("No data returned from wahoo-sync function");
      throw new Error("No response data from Wahoo sync");
    }
    
    if (data.error) {
      console.error("Error in wahoo-sync response:", data.error, data.details || "No details provided");
      throw new Error(typeof data.error === 'string' ? data.error : "Error in Wahoo sync response");
    }
    
    console.log("Wahoo sync completed successfully:", data);
    
    // If the function returned the Wahoo profile, update the local storage with the user ID if missing
    if (data.profile && data.profile.id && !tokenObj.wahoo_user_id) {
      try {
        const savedToken = localStorage.getItem("wahoo_token");
        if (savedToken) {
          const tokenData = JSON.parse(savedToken);
          tokenData.wahoo_user_id = data.profile.id;
          localStorage.setItem("wahoo_token", JSON.stringify(tokenData));
          console.log("Updated local token with Wahoo user ID from profile:", data.profile.id);
        }
      } catch (err) {
        console.error("Failed to update local token with Wahoo user ID:", err);
        // Non-critical error, continue
      }
    }
    
    // Force refresh to verify data is available in the database
    setTimeout(async () => {
      try {
        console.log("Running post-sync verification check...");
        const { data: verifyData, error: verifyError } = await supabase
          .from('routes')
          .select('count')
          .eq('user_id', userId as any) // Use 'as any' to bypass strict type checking
          .single();
          
        if (verifyError) {
          console.error("Post-sync verification error:", verifyError);
        } else if (verifyData && 'count' in verifyData) {
          console.log("Post-sync verification: Found", verifyData.count, "routes");
        } else {
          console.log("Post-sync verification: No count available in response");
        }
      } catch (e) {
        console.error("Error in post-sync verification:", e);
      }
    }, 1000);
    
    return data;
  } catch (err) {
    console.error("Exception during Wahoo sync:", err);
    throw err;
  }
}

export async function disconnectWahooAccount() {
  try {
    console.log("Disconnecting Wahoo account");
    
    // Check for authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("Error getting authenticated user for disconnect:", authError);
      throw new Error("Authentication error: " + authError.message);
    }
    
    if (!authData || !authData.user || !authData.user.id) {
      console.error("No authenticated user found for Wahoo disconnect");
      throw new Error("You must be logged in to disconnect Wahoo account");
    }
    
    const userId = authData.user.id;
    console.log("Disconnecting Wahoo account for user ID:", userId);
    
    // Clean local storage
    localStorage.removeItem("wahoo_token");
    localStorage.removeItem("wahoo_auth_state");
    
    // Call server to revoke tokens and clean up database entries
    const { data, error } = await supabase.functions.invoke("wahoo-oauth", {
      method: 'POST',
      body: {
        action: "disconnect",
        userId: userId
      }
    });
    
    if (error) {
      console.error("Error disconnecting Wahoo account:", error);
      // Continue with local disconnection even if server fails
    } else {
      console.log("Server successfully disconnected Wahoo account:", data);
    }
    
    // Notify the application about connection change
    window.dispatchEvent(new CustomEvent("wahoo_connection_changed", {
      detail: { timestamp: Date.now() }
    }));
    
    return { success: true };
  } catch (err) {
    console.error("Exception during Wahoo disconnect:", err);
    throw err;
  }
}
