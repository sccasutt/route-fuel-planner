
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface WahooActivityData {
  id: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  calories: number;
}

export function useWahooData() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activities, setActivities] = useState<WahooActivityData[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const lastEventTimestampRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);
  const hookIdRef = useRef(`wahoo-data-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    const checkWahooConnection = () => {
      try {
        const wahooToken = localStorage.getItem("wahoo_token");
        const isTokenValid = wahooToken ? isWahooTokenValid(wahooToken) : false;
        
        console.log(`[${hookIdRef.current}] Connection check ${isTokenValid ? "connected" : "disconnected"}`);
        setIsConnected(isTokenValid);
        
        if (isTokenValid && user) {
          fetchWahooActivities();
        } else {
          if (wahooToken && !isTokenValid) {
            console.log(`[${hookIdRef.current}] Removing invalid token`);
            localStorage.removeItem("wahoo_token");
            
            // Only dispatch event if we haven't just processed one
            if (!lastEventTimestampRef.current || Date.now() - lastEventTimestampRef.current > 1000) {
              const event = new CustomEvent("wahoo_connection_changed", { 
                detail: { timestamp: Date.now() } 
              });
              window.dispatchEvent(event);
            }
          }
          setIsLoading(false);
          setActivities([]);
        }
      } catch (error) {
        console.error(`[${hookIdRef.current}] Error checking Wahoo connection:`, error);
        setIsConnected(false);
        setIsLoading(false);
        setActivities([]);
      }
    };

    if (user && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      console.log(`[${hookIdRef.current}] Initializing Wahoo data hook`);
      checkWahooConnection();
    }

    // Listen for connection changes with timestamp check to prevent infinite loops
    const handleConnectionEvent = (event: CustomEvent<{ timestamp?: number }>) => {
      const timestamp = event.detail?.timestamp || Date.now();
      
      console.log(`[${hookIdRef.current}] Connection change event detected, timestamp:`, timestamp, "last:", lastEventTimestampRef.current);
      
      // Prevent duplicate/looping handling by checking timestamp
      if (lastEventTimestampRef.current && Math.abs(timestamp - lastEventTimestampRef.current) < 1000) {
        console.log(`[${hookIdRef.current}] Ignoring duplicate event`);
        return;
      }
      
      lastEventTimestampRef.current = timestamp;
      
      if (user) {
        checkWahooConnection();
      }
    };
    
    window.addEventListener("wahoo_connection_changed", handleConnectionEvent as EventListener);
    
    return () => {
      console.log(`[${hookIdRef.current}] Cleaning up Wahoo data hook`);
      window.removeEventListener("wahoo_connection_changed", handleConnectionEvent as EventListener);
    };
  }, [user, toast]);

  // Checks token expiry
  const isWahooTokenValid = (tokenString: string) => {
    try {
      const tokenData = JSON.parse(tokenString);
      const isValid = tokenData && 
                      tokenData.access_token && 
                      (!tokenData.expires_at || tokenData.expires_at > Date.now());
      
      console.log(`[${hookIdRef.current}] Token validation ${isValid ? "valid" : "invalid or expired"}`);
      return isValid;
    } catch (error) {
      console.error(`[${hookIdRef.current}] Error validating Wahoo token:`, error);
      return false;
    }
  };

  // Fetch Wahoo activities from backend
  const fetchWahooActivities = async () => {
    if (!user) {
      console.log(`[${hookIdRef.current}] No user found, not fetching activities`);
      setActivities([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      console.log(`[${hookIdRef.current}] Fetching Wahoo activities for user`, user.id);
      
      // Get Wahoo user ID from token if available
      let wahooUserId = null;
      try {
        const tokenString = localStorage.getItem("wahoo_token");
        if (tokenString) {
          const tokenData = JSON.parse(tokenString);
          wahooUserId = tokenData.wahoo_user_id;
          console.log(`[${hookIdRef.current}] Using Wahoo user ID from token:`, wahooUserId);
        }
      } catch (e) {
        console.error(`[${hookIdRef.current}] Error getting Wahoo user ID from token:`, e);
      }
      
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log(`[${hookIdRef.current}] No activities found for user`, user.id);
        setActivities([]);
      } else {
        console.log(`[${hookIdRef.current}] Retrieved ${data.length} activities for user`, user.id);
        setActivities(
          data.map((r) => ({
            id: r.id,
            name: r.name || "Unnamed Activity",
            date: r.date || new Date().toISOString(),
            distance: r.distance || 0,
            elevation: r.elevation || 0,
            duration: r.duration || "0h 0m",
            calories: r.calories || 0,
          }))
        );
      }
    } catch (error) {
      console.error(`[${hookIdRef.current}] Error fetching Wahoo activities:`, error);
      toast({
        title: "Error",
        description: "Failed to load Wahoo activities",
        variant: "destructive",
      });
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    isLoading,
    activities,
    syncStatus: isConnected ? "connected" : "disconnected",
  };
}
