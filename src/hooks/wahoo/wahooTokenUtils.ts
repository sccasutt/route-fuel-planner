
// This file exists but we'll add a function to check token validity
import { exchangeCodeForToken } from "@/components/Wahoo/WahooApi";

export async function exchangeAndSaveToken(
  code: string,
  redirectUri: string
) {
  console.log("Exchanging code for token with redirect URI:", redirectUri);
  
  let tokenData;
  tokenData = await exchangeCodeForToken(code, redirectUri);

  if (!tokenData || !tokenData.access_token)
    throw new Error("Invalid token response from server");

  const wahooUserId = tokenData.wahoo_user_id || null;
  const email = tokenData.email || null;
  
  console.log("Token data received:", {
    hasAccessToken: !!tokenData.access_token,
    hasRefreshToken: !!tokenData.refresh_token,
    hasWahooUserId: !!wahooUserId,
    hasEmail: !!email,
    email: email ? email.substring(0, 3) + "..." : "none"
  });
  
  const saveObj = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: Date.now() + tokenData.expires_in * 1000,
    wahoo_user_id: wahooUserId,
    email: email,
  };

  try {
    // Before saving new token, clear any existing token data to ensure a fresh start
    localStorage.removeItem("wahoo_token");
    
    // Store in localStorage properly
    localStorage.setItem("wahoo_token", JSON.stringify(saveObj));
    // After successful storage, remove the state that's no longer needed
    localStorage.removeItem("wahoo_auth_state");
    
    console.log("Token and user ID saved successfully", {
      hasToken: true,
      hasWahooUserId: !!wahooUserId,
      hasEmail: !!saveObj.email,
      email: saveObj.email ? saveObj.email.substring(0, 3) + "..." : "none",
      expiresIn: tokenData.expires_in
    });
    
    // Notify other components about the change
    window.dispatchEvent(new CustomEvent("wahoo_connection_changed", { 
      detail: { timestamp: Date.now() } 
    }));
  } catch (error) {
    console.error("Error saving token to localStorage:", error);
    // Continue even if storage fails - the token data will still be returned
  }

  return {
    tokenData,
    saved: saveObj,
    wahooUserId,
  };
}

export function isWahooTokenValid(tokenString: string): boolean {
  try {
    const tokenData = JSON.parse(tokenString);
    const isValid = tokenData && 
                    tokenData.access_token && 
                    (!tokenData.expires_at || tokenData.expires_at > Date.now());
    
    return isValid;
  } catch (error) {
    console.error("Error validating Wahoo token:", error);
    return false;
  }
}

export function clearWahooTokenData() {
  try {
    console.log("Clearing all Wahoo token data from local storage");
    localStorage.removeItem("wahoo_token");
    localStorage.removeItem("wahoo_auth_state");
    
    window.dispatchEvent(new CustomEvent("wahoo_connection_changed", { 
      detail: { timestamp: Date.now() } 
    }));
    
    return true;
  } catch (error) {
    console.error("Error clearing Wahoo token data:", error);
    return false;
  }
}

// Function to get Wahoo token data including email
export function getWahooTokenData() {
  try {
    const tokenString = localStorage.getItem("wahoo_token");
    if (!tokenString) {
      console.log("No Wahoo token found in local storage");
      return null;
    }
    
    const tokenData = JSON.parse(tokenString);
    console.log("Retrieved Wahoo token data:", {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      hasWahooUserId: !!tokenData.wahoo_user_id,
      hasEmail: !!tokenData.email,
      email: tokenData.email ? tokenData.email.substring(0, 3) + "..." : "none",
      expiresAt: new Date(tokenData.expires_at).toISOString()
    });
    return tokenData;
  } catch (error) {
    console.error("Error retrieving Wahoo token data:", error);
    return null;
  }
}

// Function to get just the email
export function getWahooEmail(): string | null {
  const tokenData = getWahooTokenData();
  const email = tokenData?.email || null;
  console.log("getWahooEmail returning:", email);
  return email;
}
