
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWahooCallbackToasts } from "./wahooCallbackToasts";
import { useAuth } from "@/hooks/useAuth";
import { useWahooRedirectUri } from "./useWahooRedirectUri";
import { useWahooCallbackParams } from "./useWahooCallbackParams";
import { useWahooTokenExchange } from "./useWahooTokenExchange";
import { useWahooAuthState } from "./useWahooAuthState";
import { useWahooSyncHandler } from "./useWahooSyncHandler";

interface UseProcessWahooCallbackOptions {
  setStatus: (s: string) => void;
  setError: (e: string | null) => void;
}

export function useProcessWahooCallback({
  setStatus,
  setError,
}: UseProcessWahooCallbackOptions) {
  const navigate = useNavigate();
  const { errorToast, successToast } = useWahooCallbackToasts();
  const { user } = useAuth();
  const redirectUri = useWahooRedirectUri();
  const params = useWahooCallbackParams();
  const { exchangeToken } = useWahooTokenExchange();
  const { validateState } = useWahooAuthState();
  const { handleSync } = useWahooSyncHandler(); // Use handleSync instead of syncWahooData

  const processCallback = useCallback(async () => {
    try {
      const { code, authError, errorDesc, stateFromURL, urlParams } = params;
      const storedStateJSON = localStorage.getItem("wahoo_auth_state");

      // Debug info
      console.log("WahooCallback: Callback params:", {
        hasCode: !!code,
        hasError: !!authError,
        hasStateFromURL: !!stateFromURL,
        hasStoredState: !!storedStateJSON,
        redirectUri,
        urlParams,
        isUserLoggedIn: !!user
      });

      // 1. Handle authorization error in callback
      if (authError) {
        setStatus("Authorization failed.");
        setError(errorDesc || authError);
        errorToast("Wahoo connection failed", errorDesc || authError);
        setTimeout(() => navigate("/dashboard"), 3000);
        return;
      }

      // 2. Validate state parameter for CSRF protection
      const stateResult = validateState(stateFromURL, storedStateJSON);
      if (!stateResult.valid) {
        setStatus(
          stateResult.reason === "parse-fail"
            ? "Invalid local state data."
            : "Invalid authorization state."
        );
        setError(stateResult.description || stateResult.reason);
        errorToast(
          stateResult.title || "Security error",
          stateResult.description || "State validation failed"
        );
        setTimeout(() => navigate("/dashboard"), 3000);
        return;
      }

      // 3. Validate auth code
      if (!code) {
        setStatus("No authorization code received.");
        setError("No authorization code received from Wahoo");
        errorToast(
          "Connection error",
          "No authorization code received from Wahoo"
        );
        setTimeout(() => navigate("/dashboard"), 3000);
        return;
      }

      // 4. Exchange code for token and store token
      setStatus("Connecting to your Wahoo account...");
      console.log("WahooCallback: Valid authorization code received, exchanging for token");
      console.log("Using redirect URI:", redirectUri);

      let tokenData;
      try {
        const exchangeResult = await exchangeToken(code, redirectUri);
        tokenData = exchangeResult.tokenData;
        console.log("WahooCallback: Token received successfully");
      } catch (tokenError) {
        const tokenErrorMsg =
          tokenError instanceof Error ? tokenError.message : "Unknown error";
        let errorTitle = "Connection error";
        let errorDescription = "Failed to connect to Wahoo. Please try again.";
        if (
          tokenErrorMsg.includes("connection") ||
          tokenErrorMsg.includes("refused") ||
          tokenErrorMsg.includes("unavailable") ||
          tokenErrorMsg.includes("timeout")
        ) {
          errorTitle = "Wahoo service unavailable";
          errorDescription =
            "The Wahoo service is currently unavailable. Please try again later.";
        }
        setStatus("An error occurred while connecting to Wahoo.");
        setError(errorDescription);
        errorToast(errorTitle, errorDescription);
        setTimeout(() => navigate("/dashboard"), 3000);
        return;
      }

      // 5. Save token + wahoo_user_id done above, remove state
      const wahooUserId = tokenData.wahoo_user_id || null;

      console.log("WahooCallback: Saving wahoo_user_id:", wahooUserId);

      // Dispatch connection event regardless of login state
      window.dispatchEvent(
        new CustomEvent("wahoo_connection_changed", {
          detail: { timestamp: Date.now() },
        })
      );

      // Check if user is authenticated before trying to sync
      if (!user) {
        setStatus("Wahoo connected but not synced. Please log in to sync your data.");
        successToast(
          "Wahoo connected",
          "Please log in to sync your Wahoo data"
        );

        // We'll wait a bit longer and check session status one more time
        setTimeout(() => {
          // Double check if user session became available (sometimes auth can be slow to initialize)
          if (!user) {
            navigate("/auth", { state: { wahooConnected: true }});
          } else {
            // If user became available, redirect to dashboard
            navigate("/dashboard", { state: { wahooConnected: true }});
          }
        }, 2000);
        return;
      }

      // 6. Sync profile and rides - Use handleSync directly instead of syncWahooData
      setStatus("Synchronizing your rides...");
      try {
        // Simply call handleSync() which already contains the sync logic
        await handleSync();
        
        setStatus("Your Wahoo data has been successfully synchronized!");
        
        console.log("WahooCallback: Sync successful, navigating to dashboard");
        successToast(
          "Wahoo connected",
          "Your Wahoo account is now connected."
        );
        setTimeout(
          () => navigate("/dashboard", { state: { wahooConnected: true } }),
          2000
        );
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Error synchronizing rides";
        console.error("Error syncing rides:", errMsg);

        if (
          errMsg.includes("connection") ||
          errMsg.includes("refused") ||
          errMsg.includes("unavailable") ||
          errMsg.includes("timeout")
        ) {
          setStatus(
            "Connected, but Wahoo service is currently unavailable for sync."
          );
          setError(
            "Wahoo service is currently unavailable. Your connection is established, but your rides couldn't be synchronized. Please try to sync later."
          );
        } else if (errMsg.includes("must be logged in")) {
          setStatus("Connected, but you need to be logged in to sync your data.");
          setError("Please log in to sync your Wahoo data.");
        } else {
          setStatus("Connected, but your rides couldn't be synchronized.");
          setError(errMsg || "Error synchronizing your rides from Wahoo");
        }

        // Even though sync failed, we still have a valid token, so dispatch the connection event again
        window.dispatchEvent(
          new CustomEvent("wahoo_connection_changed", {
            detail: { timestamp: Date.now() },
          })
        );
        
        errorToast(
          "Partial connection",
          "Connected to Wahoo, but couldn't sync rides. Try again later."
        );
        setTimeout(() => navigate("/dashboard"), 3000);
      }
    } catch (error) {
      console.error("Unhandled error during callback processing:", error);
      setStatus("An error occurred during authorization processing.");
      setError("Failed to connect to Wahoo. Please try again.");
      errorToast(
        "Connection error",
        "Failed to connect to Wahoo. Please try again."
      );
      setTimeout(() => navigate("/dashboard"), 3000);
    }
  // dependencies:
  }, [navigate, params, setStatus, setError, errorToast, successToast, user, redirectUri, exchangeToken, validateState, handleSync]);

  return { processCallback };
}
