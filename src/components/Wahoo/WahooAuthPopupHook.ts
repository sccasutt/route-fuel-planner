
import { useState, useEffect, useCallback } from "react";

export function useWahooAuthPopup({
  onConnect,
  onError,
}: {
  onConnect: () => void;
  onError: (desc: string) => void;
}) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initial connect state from localStorage
    const hasWahooToken = localStorage.getItem("wahoo_token");
    setIsConnected(!!hasWahooToken);
  }, []);

  // Storage and custom events for other components
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "wahoo_token") {
        setIsConnected(!!event.newValue);
      }
    };
    const handleCustomEvent = () => {
      setIsConnected(!!localStorage.getItem("wahoo_token"));
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("wahoo_connection_changed", handleCustomEvent);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("wahoo_connection_changed", handleCustomEvent);
    };
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem("wahoo_token");
    window.dispatchEvent(new CustomEvent('wahoo_connection_changed'));
    setIsConnected(false);
  }, []);

  // Remove all popup-related logic and state
  return {
    isConnecting: false,
    setIsConnecting: () => {},
    statusMessage: "",
    setStatusMessage: () => {},
    isConnected,
    setIsConnected,
    authWindow: null,
    setAuthWindow: () => {},
    disconnect,
  };
}
