
import { useState, useEffect, useCallback } from "react";

export function useWahooAuthPopup({
  onConnect,
  onError,
}: {
  onConnect: () => void;
  onError: (desc: string) => void;
}) {
  const [isConnected, setIsConnected] = useState(false);

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
        setIsConnected(isValid);
        return isValid;
      } catch (error) {
        console.error("Error checking Wahoo token:", error);
        setIsConnected(false);
        return false;
      }
    };
    
    // Run initial check
    checkToken();
  }, []);

  // Listen for events that indicate connection changes
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
          onError("Wahoo-Verbindung getrennt");
        }
      }
    };
    
    const handleCustomEvent = () => {
      console.log("useWahooAuthPopup: Custom event detected");
      
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
        setIsConnected(false);
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("wahoo_connection_changed", handleCustomEvent);
    
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
