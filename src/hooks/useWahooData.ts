
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    const checkWahooConnection = () => {
      try {
        const wahooToken = localStorage.getItem("wahoo_token");
        const isTokenValid = wahooToken ? isWahooTokenValid(wahooToken) : false;
        
        console.log("useWahooData: Connection check", isTokenValid ? "connected" : "disconnected");
        setIsConnected(isTokenValid);
        
        if (isTokenValid) {
          fetchWahooActivities();
        } else {
          if (wahooToken && !isTokenValid) {
            console.log("useWahooData: Removing invalid token");
            localStorage.removeItem("wahoo_token");
          }
          setIsLoading(false);
          setActivities([]);
        }
      } catch (error) {
        console.error("Error checking Wahoo connection:", error);
        setIsConnected(false);
        setIsLoading(false);
        setActivities([]);
      }
    };

    checkWahooConnection();

    // Listen for connection changes from any component
    const handleConnectionEvent = () => {
      console.log("useWahooData: Connection change event detected");
      checkWahooConnection();
    };
    
    window.addEventListener("wahoo_connection_changed", handleConnectionEvent);
    
    return () => {
      window.removeEventListener("wahoo_connection_changed", handleConnectionEvent);
    };
  }, []);

  // Checks token expiry
  const isWahooTokenValid = (tokenString: string) => {
    try {
      const tokenData = JSON.parse(tokenString);
      const isValid = tokenData && 
                      tokenData.access_token && 
                      (!tokenData.expires_at || tokenData.expires_at > Date.now());
      
      console.log("useWahooData: Token validation", isValid ? "valid" : "invalid or expired");
      return isValid;
    } catch (error) {
      console.error("Error validating Wahoo token:", error);
      return false;
    }
  };

  // Fetch Wahoo activities from backend
  const fetchWahooActivities = async () => {
    setIsLoading(true);
    try {
      console.log("useWahooData: Fetching Wahoo activities");
      
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .order("date", { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }
      
      if (!data) {
        console.log("useWahooData: No activities found");
        setActivities([]);
      } else {
        console.log("useWahooData: Retrieved", data.length, "activities");
        setActivities(
          data.map((r) => ({
            id: r.id,
            name: r.name,
            date: r.date,
            distance: r.distance,
            elevation: r.elevation,
            duration: r.duration,
            calories: r.calories ?? 0,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching Wahoo activities:", error);
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
