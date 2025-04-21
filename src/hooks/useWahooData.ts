
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  // Check if Wahoo is connected
  useEffect(() => {
    const checkWahooConnection = () => {
      const hasWahooToken = localStorage.getItem("wahoo_token");
      console.log("useWahooData: Checking connection status:", !!hasWahooToken);
      setIsConnected(!!hasWahooToken);
      setIsLoading(false);
    };

    checkWahooConnection();
    
    // Listen for connection changes from any component
    const handleConnectionChange = () => {
      const hasWahooToken = localStorage.getItem("wahoo_token");
      console.log("useWahooData: Storage event detected directly, token:", !!hasWahooToken);
      setIsConnected(!!hasWahooToken);
      
      // If we just connected, start loading activities
      if (hasWahooToken) {
        setIsLoading(true);
        fetchWahooActivities();
      }
    };
    
    // Listen for both normal storage events and custom events
    window.addEventListener("storage", (event) => {
      console.log("useWahooData: Storage event detected:", event.key, event.newValue);
      if (event.key === "wahoo_token") {
        handleConnectionChange();
      }
    });
    
    // Add a custom event listener for same-window updates
    window.addEventListener("wahoo_connection_changed", handleConnectionChange);
    
    return () => {
      window.removeEventListener("storage", handleConnectionChange);
      window.removeEventListener("wahoo_connection_changed", handleConnectionChange);
    };
  }, []);

  // Fetch Wahoo activities
  const fetchWahooActivities = async () => {
    if (!isConnected) {
      console.log("useWahooData: Not connected, skipping activity fetch");
      return;
    }

    console.log("useWahooData: Fetching Wahoo activities");
    setIsLoading(true);
    try {
      // In a real implementation, this would call a Supabase Edge Function
      // that communicates with the Wahoo API using the stored token
      
      // For now, we'll use sample data
      const sampleActivities: WahooActivityData[] = [
        {
          id: "w-1",
          name: "Morning Hill Climb",
          date: "2025-04-19",
          distance: 28.5,
          elevation: 450,
          duration: "1h 24m",
          calories: 680,
        },
        {
          id: "w-2",
          name: "Weekend Long Ride",
          date: "2025-04-15",
          distance: 65.2,
          elevation: 725,
          duration: "3h 10m",
          calories: 1580,
        },
        {
          id: "w-3",
          name: "Recovery Flat Loop",
          date: "2025-04-12",
          distance: 18.3,
          elevation: 120,
          duration: "0h 52m",
          calories: 410,
        },
      ];
      
      console.log("useWahooData: Setting sample activities:", sampleActivities.length);
      setActivities(sampleActivities);
    } catch (error) {
      console.error("Error fetching Wahoo activities:", error);
      toast({
        title: "Error",
        description: "Failed to load Wahoo activities",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch activities when connection status changes
  useEffect(() => {
    if (isConnected) {
      console.log("useWahooData: Connected, fetching activities");
      fetchWahooActivities();
    } else {
      console.log("useWahooData: Not connected, clearing activities");
      setActivities([]);
    }
  }, [isConnected]);

  return {
    isConnected,
    isLoading,
    activities,
    syncStatus: isConnected ? "connected" : "disconnected",
  };
}
