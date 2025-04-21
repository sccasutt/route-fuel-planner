
import { useState, useEffect, useCallback } from "react";

export function useWahooAuthPopup({
  onConnect,
  onError,
}: {
  onConnect: () => void;
  onError: (desc: string) => void;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTimestamp, setLastEventTimestamp] = useState<number | null>(null);

  // Check for connection on initial load and validate token
  useEffect(() => {
    console.log("useWahooAuthPopup: Checking initial connection state");
    
    const checkToken = () => {
      try {
        const tokenString = localStorage.getItem("wahoo_token");
        if (!tokenString) {
          console.log("No Wahoo token found");
          setIsConnected(false);
          return false;
        }
        
        const token = JSON.parse(tokenString);
        const isValid = token && token.access_token && (!token.expires_at || token.expires_at > Date.now());
        
        console.log("Wahoo token validation:", isValid ? "valid" : "invalid or expired");
        
        if (isValid) {
          setIsConnected(true);
          onConnect();
        } else {
          setIsConnected(false);
          localStorage.removeItem("wahoo_token");
          localStorage.removeItem("wahoo_auth_state");
          onError("Wahoo token is invalid or expired");
        }
        
        return isValid;
      } catch (error) {
        console.error("Error checking Wahoo token:", error);
        localStorage.removeItem("wahoo_token");
        localStorage.removeItem("wahoo_auth_state");
        setIsConnected(false);
        onError("Error validating Wahoo connection");
        return false;
      }
    };
    
    // Run initial check
    checkToken();
  }, [onConnect, onError]);

  // Listen for events that indicate connection changes - with timestamp check to prevent infinite loop
  useEffect(() => {
    console.log("useWahooAuthPopup: Setting up event listeners");
    
    const handleStorageChange = (event: StorageEvent) => {
      console.log("useWahooAuthPopup: Storage event detected", event.key, event.newValue ? "has value" : "empty");
      
      if (event.key === "wahoo_token") {
        const hasToken = !!event.newValue;
        setIsConnected(hasToken);
        
        if (hasToken && onConnect) {
          onConnect();
        } else if (!hasToken && onError) {
          onError("Wahoo connection disconnected");
        }
      }
    };
    
    const handleCustomEvent = (event: CustomEvent<{ timestamp?: number }>) => {
      const timestamp = event.detail?.timestamp || Date.now();
      console.log("useWahooAuthPopup: Custom event detected", event.type, "timestamp:", timestamp, "last:", lastEventTimestamp);

      // Prevent duplicate/looping handling by checking timestamp
      if (lastEventTimestamp && Math.abs(timestamp - lastEventTimestamp) < 500) {
        console.log("useWahooAuthPopup: Ignoring duplicate event", timestamp);
        return;
      }
      
      setLastEventTimestamp(timestamp);
      
      try {
        const tokenString = localStorage.getItem("wahoo_token");
        const hasValidToken = tokenString && JSON.parse(tokenString).access_token;
        
        console.log("Custom event token check:", hasValidToken ? "valid" : "invalid or missing");
        setIsConnected(!!hasValidToken);
        
        if (hasValidToken && onConnect) {
          onConnect();
        }
      } catch (error) {
        console.error("Error processing custom event:", error);
        localStorage.removeItem("wahoo_token");
        localStorage.removeItem("wahoo_auth_state");
        setIsConnected(false);
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("wahoo_connection_changed", handleCustomEvent as EventListener);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("wahoo_connection_changed", handleCustomEvent as EventListener);
    };
  }, [lastEventTimestamp, onConnect, onError]);

  // Disconnect function
  const disconnect = useCallback(() => {
    console.log("useWahooAuthPopup: Disconnecting");
    localStorage.removeItem("wahoo_token");
    localStorage.removeItem("wahoo_auth_state");
    
    const event = new CustomEvent("wahoo_connection_changed", { 
      detail: { timestamp: Date.now() } 
    });
    window.dispatchEvent(event);
    
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    setIsConnected,
    disconnect,
  };
}
