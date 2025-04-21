
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export function useWahooAuthPopup({
  onConnect,
  onError,
}: {
  onConnect: () => void;
  onError: (desc: string) => void;
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [authWindow, setAuthWindow] = useState<Window | null>(null);

  // Initial connect state from localStorage
  useEffect(() => {
    const hasWahooToken = localStorage.getItem("wahoo_token");
    if (hasWahooToken) setIsConnected(true);
  }, []);

  // Handle popup message events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'wahoo-connected') {
        setIsConnecting(false);
        setStatusMessage("");
        setIsConnected(true);
        
        // Store connection in localStorage - ensure we dispatch a storage event
        // so other components can react to this change
        const previousValue = localStorage.getItem("wahoo_token");
        localStorage.setItem("wahoo_token", "connected");
        
        // Manually dispatch storage event since same-tab changes don't trigger it
        if (previousValue !== "connected") {
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'wahoo_token',
            newValue: 'connected',
            oldValue: previousValue,
            storageArea: localStorage
          }));
        }
        
        onConnect();
        if (authWindow && !authWindow.closed) authWindow.close();
      }
      if (event.data && event.data.type === 'wahoo-error') {
        setIsConnecting(false);
        setStatusMessage("");
        onError(event.data.description || event.data.error || "Failed to connect to Wahoo");
        if (authWindow && !authWindow.closed) authWindow.close();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConnect, onError, authWindow]);

  // Monitor popup closed
  useEffect(() => {
    let popupCheckInterval: number | undefined;
    if (isConnecting && authWindow) {
      popupCheckInterval = window.setInterval(() => {
        if (authWindow.closed) {
          setIsConnecting(false);
          setStatusMessage("");
          clearInterval(popupCheckInterval);
        }
      }, 500);
    }
    return () => {
      if (popupCheckInterval) clearInterval(popupCheckInterval);
    };
  }, [isConnecting, authWindow]);

  const disconnect = useCallback(() => {
    // Ensure we dispatch a storage event when disconnecting
    const previousValue = localStorage.getItem("wahoo_token");
    localStorage.removeItem("wahoo_token");
    
    // Manually dispatch storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'wahoo_token',
      newValue: null,
      oldValue: previousValue,
      storageArea: localStorage
    }));
    
    setIsConnected(false);
  }, []);

  return {
    isConnecting,
    setIsConnecting,
    statusMessage,
    setStatusMessage,
    isConnected,
    setIsConnected,
    authWindow,
    setAuthWindow,
    disconnect,
  };
}
