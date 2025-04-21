
import { useState, useEffect, useCallback } from "react";

export function useWahooAuthPopup({
  onConnect,
  onError,
}: {
  onConnect: () => void;
  onError: (desc: string) => void;
}) {
  const [isConnected, setIsConnected] = useState(false);

  // Check for connection on initial load
  useEffect(() => {
    console.log("useWahooAuthPopup: Checking initial connection state");
    const hasWahooToken = localStorage.getItem("wahoo_token");
    setIsConnected(!!hasWahooToken);
  }, []);

  // Listen for storage changes (for cross-tab synchronization)
  useEffect(() => {
    console.log("useWahooAuthPopup: Setting up event listeners");
    
    const handleStorageChange = (event: StorageEvent) => {
      console.log("useWahooAuthPopup: Storage event detected", event.key, event.newValue);
      if (event.key === "wahoo_token") {
        setIsConnected(!!event.newValue);
        if (event.newValue && onConnect) {
          onConnect();
        }
      }
    };
    
    const handleCustomEvent = (event: Event) => {
      console.log("useWahooAuthPopup: Custom event detected");
      const hasToken = localStorage.getItem("wahoo_token");
      setIsConnected(!!hasToken);
      if (hasToken && onConnect) {
        onConnect();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("wahoo_connection_changed", handleCustomEvent);
    
    // Also check URL parameters on load for any Wahoo auth response
    // This handles the case when redirected back from the Supabase Edge Function
    const url = new URL(window.location.href);
    const wahooSuccess = url.searchParams.get("wahoo_success");
    const wahooError = url.searchParams.get("wahoo_error");
    
    if (wahooSuccess === "true") {
      console.log("useWahooAuthPopup: Detected successful auth in URL");
      localStorage.setItem("wahoo_token", "connected");
      window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
      
      // Clean up URL parameters
      url.searchParams.delete("wahoo_success");
      window.history.replaceState({}, document.title, url.toString());
      
      if (onConnect) {
        onConnect();
      }
    } else if (wahooError) {
      console.error("useWahooAuthPopup: Auth error detected in URL:", wahooError);
      if (onError) {
        onError(wahooError);
      }
      
      // Clean up URL parameters
      url.searchParams.delete("wahoo_error");
      window.history.replaceState({}, document.title, url.toString());
    }
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("wahoo_connection_changed", handleCustomEvent);
    };
  }, [onConnect, onError]);

  // Disconnect function
  const disconnect = useCallback(() => {
    console.log("useWahooAuthPopup: Disconnecting");
    localStorage.removeItem("wahoo_token");
    localStorage.removeItem("wahoo_auth_state");
    window.dispatchEvent(new CustomEvent('wahoo_connection_changed'));
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    setIsConnected,
    disconnect,
  };
}
