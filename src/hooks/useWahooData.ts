
import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { useWahooActivityFetcher } from "./wahoo/useWahooActivityFetcher";
import { useWahooConnectionStatus } from "./wahoo/useWahooConnectionStatus";
import { WahooActivityData, wahooGlobalState } from "./wahoo/wahooTypes";
import { supabase } from "@/integrations/supabase/client";

export type { WahooActivityData } from "./wahoo/wahooTypes";

export function useWahooData() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const hasInitializedRef = useRef(false);
  const hookIdRef = useRef(`wahoo-data-${Math.random().toString(36).substring(2, 9)}`);
  
  // Use our extracted hooks
  const { isConnected, checkConnectionStatus } = useWahooConnectionStatus(hookIdRef.current);
  const { activities, fetchWahooActivities, isLoading: activitiesLoading } = useWahooActivityFetcher();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        console.log(`[${hookIdRef.current}] No active session found`);
        setIsLoading(false);
        return false;
      }
      return true;
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // Initialize when user is available
    if (user && !hasInitializedRef.current) {
      console.log(`[${hookIdRef.current}] Initializing Wahoo data hook for user:`, user.id);
      
      const connected = checkConnectionStatus();
      console.log(`[${hookIdRef.current}] Connection check result:`, connected ? "connected" : "disconnected");
      
      // Always try to fetch data if we have a user, regardless of connection status
      // This helps catch cases where the data exists but the connection check fails
      fetchWahooActivities(user.id, hookIdRef.current);
      
      hasInitializedRef.current = true;
      wahooGlobalState.isInitialized = true;
      wahooGlobalState.lastFetchTimestamp = Date.now();
    }
  }, [user, checkConnectionStatus, fetchWahooActivities]);

  // Listen for connection status changes
  useEffect(() => {
    const handleConnectionChange = () => {
      console.log(`[${hookIdRef.current}] Connection status changed, refreshing data`);
      if (user) {
        fetchWahooActivities(user.id, hookIdRef.current);
      }
    };

    window.addEventListener("wahoo_connection_changed", handleConnectionChange);
    
    return () => {
      console.log(`[${hookIdRef.current}] Removing connection event listener`);
      window.removeEventListener("wahoo_connection_changed", handleConnectionChange);
    };
  }, [user, fetchWahooActivities]);

  // Update loading state when activities loading changes
  useEffect(() => {
    setIsLoading(activitiesLoading);
  }, [activitiesLoading]);

  // Refresh function for manual data fetch
  const refresh = () => {
    if (user) {
      console.log(`[${hookIdRef.current}] Manually refreshing data for user:`, user.id);
      wahooGlobalState.lastFetchTimestamp = Date.now();
      fetchWahooActivities(user.id, hookIdRef.current);
    } else {
      console.log(`[${hookIdRef.current}] Cannot refresh: user not found`);
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
