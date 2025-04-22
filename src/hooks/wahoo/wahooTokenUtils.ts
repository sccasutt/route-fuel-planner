
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

  localStorage.setItem("wahoo_token", JSON.stringify(saveObj));
  localStorage.removeItem("wahoo_auth_state");

  return {
    tokenData,
    saved: saveObj,
    wahooUserId,
  };
}
