
import { useCallback } from "react";
import { useWahooRedirectUri } from "./useWahooRedirectUri";
import { useWahooExchangeCallback } from "./useWahooExchangeCallback";
import { useWahooCallbackSync } from "./useWahooCallbackSync";
import { useWahooCallbackNavigation } from "./useWahooCallbackNavigation";

interface UseProcessWahooCallbackOptions {
  setStatus: (s: string) => void;
  setError: (e: string | null) => void;
}

export function useProcessWahooCallback({
  setStatus,
  setError,
}: UseProcessWahooCallbackOptions) {
  const redirectUri = useWahooRedirectUri();
  const { validateCallback, performTokenExchange } = useWahooExchangeCallback();
  const { performSync } = useWahooCallbackSync();
  const { navigateWithError } = useWahooCallbackNavigation();

  const processCallback = useCallback(async () => {
    try {
      // Step 1: Validate the callback parameters
      const validationResult = validateCallback();
      
      if (!validationResult.isValid) {
        setStatus("Authorization failed.");
        setError(validationResult.errorDescription || validationResult.error);
        navigateWithError(
          "Wahoo connection failed", 
          validationResult.errorDescription || validationResult.error || "Authentication failed"
        );
        return;
      }
      
      // Step 2: Exchange code for token
      setStatus("Connecting to your Wahoo account...");
      const exchangeResult = await performTokenExchange(validationResult.code!, redirectUri);
      
      if (!exchangeResult.success) {
        setStatus("An error occurred while connecting to Wahoo.");
        setError(exchangeResult.error || "Connection failed");
        navigateWithError(
          exchangeResult.errorTitle || "Connection error", 
          exchangeResult.error || "Failed to connect to Wahoo. Please try again."
        );
        return;
      }
      
      // Dispatch connection event 
      window.dispatchEvent(
        new CustomEvent("wahoo_connection_changed", {
          detail: { timestamp: Date.now() },
        })
      );
      
      // Step 3: Perform sync operations
      await performSync(setStatus, setError);
      
    } catch (error) {
      console.error("Unhandled error during callback processing:", error);
      setStatus("An error occurred during authorization processing.");
      setError("Failed to connect to Wahoo. Please try again.");
      navigateWithError(
        "Connection error",
        "Failed to connect to Wahoo. Please try again."
      );
    }
  }, [
    validateCallback,
    performTokenExchange,
    performSync,
    navigateWithError,
    redirectUri,
    setStatus,
    setError
  ]);

  return { processCallback };
}
