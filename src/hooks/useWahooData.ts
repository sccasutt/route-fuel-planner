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
      const wahooToken = localStorage.getItem("wahoo_token");
      const isTokenValid = wahooToken ? isWahooTokenValid(wahooToken) : false;
      setIsConnected(isTokenValid);
      if (isTokenValid) {
        fetchWahooActivities();
      } else {
        if (wahooToken && !isTokenValid) {
          localStorage.removeItem("wahoo_token");
        }
        setIsLoading(false);
        setActivities([]);
      }
    };

    checkWahooConnection();

    // Listen for connection changes from any component
    const handleConnectionEvent = () => {
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
      return tokenData && tokenData.access_token && tokenData.expires_at && tokenData.expires_at > Date.now();
    } catch {
      return false;
    }
  };

  // Fetch Wahoo activities from backend
  const fetchWahooActivities = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .order("date", { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }
      if (!data) {
        setActivities([]);
      } else {
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
