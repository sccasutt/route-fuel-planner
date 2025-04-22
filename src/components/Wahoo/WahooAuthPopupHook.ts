
import { useState, useEffect, useCallback, useRef } from "react";

// Create a singleton pattern to ensure we only check initialization once across the application
let globalInitialized = false;
let globalConnectionState = false;

export function useWahooAuthPopup({
  onConnect,
  onError,
}: {
  onConnect: () => void;
  onError: (desc: string) => void;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const lastEventTimestampRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);
  const componentIdRef = useRef(`wahoo-auth-${Math.random().toString(36).substring(2, 9)}`);

  // Check for connection on initial load and validate token - but only once
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    // If global initialization already happened, use that state instead
    if (globalInitialized) {
      console.log(`[${componentIdRef.current}] Using global connection state: ${globalConnectionState}`);
      setIsConnected(globalConnectionState);
      if (globalConnectionState && onConnect) {
        onConnect();
      }
      return;
    }

    console.log(`[${componentIdRef.current}] Performing initial connection check`);
    globalInitialized = true;
    
    const checkToken = () => {
      try {
        const tokenString = localStorage.getItem("wahoo_token");
        if (!tokenString) {
          console.log(`[${componentIdRef.current}] No Wahoo token found`);
          setIsConnected(false);
          globalConnectionState = false;
          return false;
        }
        
        const token = JSON.parse(tokenString);
        const isValid = token && token.access_token && (!token.expires_at || token.expires_at > Date.now());
        
        console.log(`[${componentIdRef.current}] Wahoo token validation: ${isValid ? "valid" : "invalid or expired"}`);
        
        if (isValid) {
          setIsConnected(true);
          globalConnectionState = true;
          if (onConnect) onConnect();
        } else {
          setIsConnected(false);
          globalConnectionState = false;
          localStorage.removeItem("wahoo_token");
          localStorage.removeItem("wahoo_auth_state");
          if (onError) onError("Wahoo token is invalid or expired");
        }
        
        return isValid;
      } catch (error) {
        console.error(`[${componentIdRef.current}] Error checking Wahoo token:`, error);
        localStorage.removeItem("wahoo_token");
        localStorage.removeItem("wahoo_auth_state");
        setIsConnected(false);
        globalConnectionState = false;
        if (onError) onError("Error validating Wahoo connection");
        return false;
      }
    };
    
    // Run initial check
    checkToken();
  }, [onConnect, onError]);

  // Listen for events that indicate connection changes
  useEffect(() => {
    console.log(`[${componentIdRef.current}] Setting up event listeners`);
    
    const handleStorageChange = (event: StorageEvent) => {
      console.log(`[${componentIdRef.current}] Storage event detected`, event.key, event.newValue ? "has value" : "empty");
      
      if (event.key === "wahoo_token") {
        const hasToken = !!event.newValue;
        setIsConnected(hasToken);
        globalConnectionState = hasToken;
        
        if (hasToken && onConnect) {
          onConnect();
        } else if (!hasToken && onError) {
          onError("Wahoo connection disconnected");
        }
      }
    };
    
    const handleCustomEvent = (event: CustomEvent<{ timestamp?: number }>) => {
      const timestamp = event.detail?.timestamp || Date.now();
      const lastTimestamp = lastEventTimestampRef.current;
      
      console.log(`[${componentIdRef.current}] Custom event detected`, event.type, "timestamp:", timestamp, "last:", lastTimestamp);

      // Prevent duplicate/looping handling by checking timestamp
      if (lastTimestamp && Math.abs(timestamp - lastTimestamp) < 1000) {
        console.log(`[${componentIdRef.current}] Ignoring duplicate event`, timestamp);
        return;
      }
      
      lastEventTimestampRef.current = timestamp;
      
      try {
        const tokenString = localStorage.getItem("wahoo_token");
        const hasValidToken = tokenString && JSON.parse(tokenString).access_token;
        
        console.log(`[${componentIdRef.current}] Custom event token check:`, hasValidToken ? "valid" : "invalid or missing");
        setIsConnected(!!hasValidToken);
        globalConnectionState = !!hasValidToken;
        
        if (hasValidToken && onConnect) {
          onConnect();
        }
      } catch (error) {
        console.error(`[${componentIdRef.current}] Error processing custom event:`, error);
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("wahoo_connection_changed", handleCustomEvent as EventListener);
    
    return () => {
      console.log(`[${componentIdRef.current}] Removing event listeners`);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("wahoo_connection_changed", handleCustomEvent as EventListener);
    };
  }, [onConnect, onError]);

  // Disconnect function
  const disconnect = useCallback(() => {
    console.log(`[${componentIdRef.current}] Disconnecting`);
    localStorage.removeItem("wahoo_token");
    localStorage.removeItem("wahoo_auth_state");
    
    const event = new CustomEvent("wahoo_connection_changed", { 
      detail: { timestamp: Date.now() } 
    });
    window.dispatchEvent(event);
    
    setIsConnected(false);
    globalConnectionState = false;
  }, []);

  return {
    isConnected,
    setIsConnected,
    disconnect,
  };
}
