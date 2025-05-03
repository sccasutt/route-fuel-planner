
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
  const saveObj = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: Date.now() + tokenData.expires_in * 1000,
    wahoo_user_id: wahooUserId,
  };

  try {
    // Store in localStorage properly
    localStorage.setItem("wahoo_token", JSON.stringify(saveObj));
    // After successful storage, remove the state that's no longer needed
    localStorage.removeItem("wahoo_auth_state");
    
    console.log("Token and user ID saved successfully", {
      hasToken: true,
      hasWahooUserId: !!wahooUserId,
      expiresIn: tokenData.expires_in
    });
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
