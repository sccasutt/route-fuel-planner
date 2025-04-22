
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
    
    // Create request body and log it for debugging
    const requestBody = {
      access_token: tokenObj.access_token,
      refresh_token: tokenObj.refresh_token,
      wahoo_user_id: tokenObj.wahoo_user_id || null,
      user_id: userId
    };

    // Log the complete request body for debugging (excluding tokens)
    const debugBody = {
      ...requestBody,
      access_token: !!requestBody.access_token,
      refresh_token: !!requestBody.refresh_token
    };
    console.log("Debug - Request body before sending:", debugBody);

    // Get access token for auth header
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Failed to get session for access token:", sessionError);
      throw new Error("Could not get access token for sync.");
    }
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      console.error("No access token available for function Authorization header");
      throw new Error("No access token for authenticated request");
    }

    // CRITICAL FIX: Add Authorization header AND use correct types
    const requestOptions = {
      method: "POST" as const,
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
    };

    console.log("Invoking wahoo-sync function with options:", {
      method: requestOptions.method,
      bodyLength: JSON.stringify(requestBody).length,
      contentType: requestOptions.headers["Content-Type"],
      hasAuthorization: !!requestOptions.headers["Authorization"]
    });

    const { data, error } = await supabase.functions.invoke("wahoo-sync", requestOptions);

    if (error) {
      console.error("Error syncing Wahoo data:", error);
      throw error;
    }
    
    if (!data || (data.error && typeof data.error === 'string')) {
      console.error("Wahoo sync returned an error response:", data);
      throw new Error(data.error || "Error in Wahoo sync response");
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
    
    return data;
  } catch (err) {
    console.error("Exception during Wahoo sync:", err);
    throw err;
  }
}
