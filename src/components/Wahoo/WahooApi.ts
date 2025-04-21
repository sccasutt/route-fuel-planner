
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
    
    console.log("Successfully fetched Wahoo client ID:", data.clientId.substring(0, 5) + "...");
    return data.clientId;
  } catch (err) {
    console.error("Exception fetching Wahoo client ID:", err);
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    
    // Provide more descriptive error messages for common connection issues
    if (message.includes("fetch") || message.includes("network") || message.includes("connection")) {
      throw new Error("Network connection error. Please check your internet connection and try again.");
    }
    
    throw new Error(`Failed to get Wahoo client ID: ${message}`);
  }
}

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  console.log("Exchanging authorization code for token...");
  try {
    console.log(`Sending token exchange request with code length: ${code.length}, redirectUri: ${redirectUri}`);
    
    const { data, error } = await supabase.functions.invoke('wahoo-oauth/token-exchange', {
      method: 'POST',
      body: { code, redirectUri }
    });
    
    if (error) {
      console.error("Error exchanging code for token:", error);
      throw new Error(error.message || "Failed to exchange code for token");
    }
    
    if (!data || !data.access_token) {
      console.error("Invalid token response:", data);
      throw new Error("Invalid token response from server");
    }
    
    console.log("Successfully exchanged code for token:", {
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      expiresIn: data.expires_in
    });
    
    return data;
  } catch (err) {
    console.error("Exception exchanging code for token:", err);
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    
    // Provide more descriptive error messages for common issues
    if (message.includes("fetch") || message.includes("network") || message.includes("connection")) {
      throw new Error("Network connection error. Please check your internet connection and try again.");
    }
    
    throw new Error(`Failed to exchange code for token: ${message}`);
  }
}
