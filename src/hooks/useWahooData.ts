
import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { useWahooActivityFetcher } from "./wahoo/useWahooActivityFetcher";
import { useWahooConnectionStatus } from "./wahoo/useWahooConnectionStatus";
import { WahooActivityData, wahooGlobalState } from "./wahoo/wahooTypes";

export type { WahooActivityData } from "./wahoo/wahooTypes";

export function useWahooData() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const hasInitializedRef = useRef(false);
  const hookIdRef = useRef(`wahoo-data-${Math.random().toString(36).substring(2, 9)}`);
  
  // Use our extracted hooks
  const { isConnected, checkConnectionStatus } = useWahooConnectionStatus(hookIdRef.current);
  const { activities, fetchWahooActivities, isLoading: activitiesLoading } = useWahooActivityFetcher();

  useEffect(() => {
    // Only initialize once per user session
    if (user && !hasInitializedRef.current && !wahooGlobalState.isInitialized) {
      hasInitializedRef.current = true;
      wahooGlobalState.isInitialized = true;
      console.log(`[${hookIdRef.current}] Initializing Wahoo data hook`);
      
      const connected = checkConnectionStatus();
      
      if (connected) {
        // Only fetch if we haven't fetched recently (throttle API calls)
        const now = Date.now();
        if (now - wahooGlobalState.lastFetchTimestamp > 30000) { // 30 second throttle
          wahooGlobalState.lastFetchTimestamp = now;
          fetchWahooActivities(user.id, hookIdRef.current);
        } else {
          console.log(`[${hookIdRef.current}] Skipping fetch, last fetch was ${(now - wahooGlobalState.lastFetchTimestamp)/1000}s ago`);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    } else if (user && hasInitializedRef.current) {
      // We're already initialized, just update our state
      console.log(`[${hookIdRef.current}] Already initialized, updating state only`);
      setIsLoading(false);
    }
  }, [user, checkConnectionStatus, fetchWahooActivities]);

  // Update loading state when activities loading changes
  useEffect(() => {
    setIsLoading(activitiesLoading);
  }, [activitiesLoading]);

  // Refresh function for manual data fetch
  const refresh = () => {
    if (user && isConnected) {
      wahooGlobalState.lastFetchTimestamp = Date.now();
      fetchWahooActivities(user.id, hookIdRef.current);
    }
  };

  return {
    isConnected,
    isLoading,
    activities,
    syncStatus: isConnected ? "connected" : "disconnected",
    refresh // Expose refresh function for manual data refresh
  };
}
