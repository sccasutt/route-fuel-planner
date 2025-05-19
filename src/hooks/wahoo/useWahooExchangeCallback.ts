
import { useCallback } from "react";
import { useWahooTokenExchange } from "./useWahooTokenExchange";
import { useWahooAuthState } from "./useWahooAuthState";
import { useWahooCallbackParams } from "./useWahooCallbackParams";

interface ValidationResult {
  isValid: boolean;
  code?: string;
  error?: string;
  errorDescription?: string;
}

export function useWahooExchangeCallback() {
  const params = useWahooCallbackParams();
  const { exchangeToken } = useWahooTokenExchange();
  const { validateState } = useWahooAuthState();

  const validateCallback = useCallback((): ValidationResult => {
    const { code, authError, errorDesc, stateFromURL } = params;
    const storedStateJSON = localStorage.getItem("wahoo_auth_state");

    // Debug info
    console.log("WahooCallback: Validating callback params:", {
      hasCode: !!code,
      hasError: !!authError,
      hasStateFromURL: !!stateFromURL,
      hasStoredState: !!storedStateJSON,
    });

    // 1. Handle authorization error in callback
    if (authError) {
      return {
        isValid: false,
        error: authError,
        errorDescription: errorDesc || authError
      };
    }

    // 2. Validate state parameter for CSRF protection
    const stateResult = validateState(stateFromURL, storedStateJSON);
    if (!stateResult.valid) {
      return {
        isValid: false,
        error: stateResult.reason === "parse-fail" 
          ? "Invalid local state data." 
          : "Invalid authorization state.",
        errorDescription: stateResult.description || stateResult.reason
      };
    }

    // 3. Validate auth code
    if (!code) {
      return {
        isValid: false,
        error: "No authorization code received.",
        errorDescription: "No authorization code received from Wahoo"
      };
    }

    return {
      isValid: true,
      code
    };
  }, [params, validateState]);

  const performTokenExchange = useCallback(async (
    code: string, 
    redirectUri: string
  ) => {
    console.log("WahooCallback: Valid authorization code received, exchanging for token");
    console.log("Using redirect URI:", redirectUri);

    try {
      const exchangeResult = await exchangeToken(code, redirectUri);
      console.log("WahooCallback: Token received successfully");
      return {
        success: true,
        tokenData: exchangeResult.tokenData,
        wahooUserId: exchangeResult.wahooUserId
      };
    } catch (tokenError) {
      const tokenErrorMsg = tokenError instanceof Error ? tokenError.message : "Unknown error";
      let errorTitle = "Connection error";
      let errorDescription = "Failed to connect to Wahoo. Please try again.";
      
      if (
        tokenErrorMsg.includes("connection") ||
        tokenErrorMsg.includes("refused") ||
        tokenErrorMsg.includes("unavailable") ||
        tokenErrorMsg.includes("timeout")
      ) {
        errorTitle = "Wahoo service unavailable";
        errorDescription = "The Wahoo service is currently unavailable. Please try again later.";
      }
      
      return {
        success: false,
        error: errorDescription,
        errorTitle
      };
    }
  }, [exchangeToken]);

  return {
    validateCallback,
    performTokenExchange
  };
}
