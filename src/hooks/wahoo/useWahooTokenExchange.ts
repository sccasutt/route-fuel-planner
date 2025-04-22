
import { exchangeAndSaveToken } from "./wahooTokenUtils";

export function useWahooTokenExchange() {
  const exchangeToken = async (code: string, redirectUri: string) => {
    try {
      console.log("Exchanging token with code length:", code.length, "redirectUri:", redirectUri);
      
      const result = await exchangeAndSaveToken(code, redirectUri);
      console.log("Token exchange successful", {
        hasToken: !!result.tokenData.access_token,
        hasWahooUserId: !!result.wahooUserId
      });
      
      return result;
    } catch (error) {
      console.error("Token exchange failed:", error);
      throw error;
    }
  };

  return { exchangeToken };
}
