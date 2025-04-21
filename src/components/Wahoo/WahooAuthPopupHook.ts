
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
    console.log("useWahooAuthPopup: Initial localStorage check for token:", !!hasWahooToken);
    setIsConnected(!!hasWahooToken);
  }, []);

  // Handle popup message events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("Received message from popup:", event.data);
      
      if (event.data && event.data.type === 'wahoo-connected') {
        setIsConnecting(false);
        setStatusMessage("");
        setIsConnected(true);
        
        // Store connection in localStorage - ensure we dispatch a storage event
        // so other components can react to this change
        const previousValue = localStorage.getItem("wahoo_token");
        localStorage.setItem("wahoo_token", "connected");
        console.log("Setting wahoo_token in localStorage");
        
        // Manually dispatch storage event since same-tab changes don't trigger it
        if (previousValue !== "connected") {
          // 1. Fire regular storage event for cross-tab communication
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'wahoo_token',
            newValue: 'connected',
            oldValue: previousValue,
            storageArea: localStorage
          }));
          
          // 2. Fire custom event for same-tab communication
          window.dispatchEvent(new CustomEvent('wahoo_connection_changed'));
        }
        
        onConnect();
        if (authWindow && !authWindow.closed) authWindow.close();
      }
      if (event.data && event.data.type === 'wahoo-error') {
        console.error("Wahoo connection error:", event.data);
        setIsConnecting(false);
        setStatusMessage("");
        onError(event.data.description || event.data.error || "Failed to connect to Wahoo");
        if (authWindow && !authWindow.closed) authWindow.close();
      }
    };
    
    console.log("Adding message event listener");
    window.addEventListener("message", handleMessage);
    return () => {
      console.log("Removing message event listener");
      window.removeEventListener("message", handleMessage);
    };
  }, [onConnect, onError, authWindow]);

  // Monitor popup closed
  useEffect(() => {
    let popupCheckInterval: number | undefined;
    if (isConnecting && authWindow) {
      popupCheckInterval = window.setInterval(() => {
        if (authWindow.closed) {
          console.log("Auth popup was closed by user");
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

  // Listen for storage events from other components
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      console.log("Storage event:", event.key, event.newValue);
      if (event.key === "wahoo_token") {
        setIsConnected(!!event.newValue);
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // Listen for custom event as well
    const handleCustomEvent = () => {
      const hasToken = !!localStorage.getItem("wahoo_token");
      console.log("Custom wahoo connection event detected, token:", hasToken);
      setIsConnected(hasToken);
    };
    
    window.addEventListener("wahoo_connection_changed", handleCustomEvent);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("wahoo_connection_changed", handleCustomEvent);
    };
  }, []);

  const disconnect = useCallback(() => {
    // Ensure we dispatch a storage event when disconnecting
    const previousValue = localStorage.getItem("wahoo_token");
    localStorage.removeItem("wahoo_token");
    console.log("Removing wahoo_token from localStorage");
    
    // Manually dispatch storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'wahoo_token',
      newValue: null,
      oldValue: previousValue,
      storageArea: localStorage
    }));
    
    // Dispatch custom event for same-tab communication
    window.dispatchEvent(new CustomEvent('wahoo_connection_changed'));
    
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
