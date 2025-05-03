
import { useState, useEffect, useRef } from "react";
import { isWahooTokenValid } from "./wahooTokenUtils";

export function useWahooConnectionStatus(hookId: string) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const lastEventTimestampRef = useRef<number | null>(null);

  // Set up connection change listener
  useEffect(() => {
    // Listen for connection changes with timestamp check to prevent infinite loops
    const handleConnectionEvent = (event: CustomEvent<{ timestamp?: number }>) => {
      const timestamp = event.detail?.timestamp || Date.now();
      
      console.log(`[${hookId}] Connection change event detected, timestamp:`, timestamp, "last:", lastEventTimestampRef.current);
      
      // Prevent duplicate/looping handling by checking timestamp
      if (lastEventTimestampRef.current && Math.abs(timestamp - lastEventTimestampRef.current) < 1000) {
        console.log(`[${hookId}] Ignoring duplicate event`);
        return;
      }
      
      lastEventTimestampRef.current = timestamp;
      
      // Check connection status
      checkConnectionStatus();
    };
    
    window.addEventListener("wahoo_connection_changed", handleConnectionEvent as EventListener);
    
    return () => {
      console.log(`[${hookId}] Removing connection event listener`);
      window.removeEventListener("wahoo_connection_changed", handleConnectionEvent as EventListener);
    };
  }, [hookId]);

  const checkConnectionStatus = () => {
    try {
      const wahooToken = localStorage.getItem("wahoo_token");
      const tokenValid = wahooToken ? isWahooTokenValid(wahooToken) : false;
      
      console.log(`[${hookId}] Connection check ${tokenValid ? "connected" : "disconnected"}`);
      setIsConnected(tokenValid);
      
      if (wahooToken && !tokenValid) {
        console.log(`[${hookId}] Removing invalid token`);
        localStorage.removeItem("wahoo_token");
        
        // Only dispatch event if we haven't just processed one
        if (!lastEventTimestampRef.current || Date.now() - lastEventTimestampRef.current > 1000) {
          const event = new CustomEvent("wahoo_connection_changed", { 
            detail: { timestamp: Date.now() } 
          });
          window.dispatchEvent(event);
        }
      }
      
      return tokenValid;
    } catch (error) {
      console.error(`[${hookId}] Error checking connection status:`, error);
      setIsConnected(false);
      return false;
    }
  };

  return {
    isConnected,
    checkConnectionStatus
  };
}
