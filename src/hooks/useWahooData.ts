
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
      setIsConnected(!!hasWahooToken);
      setIsLoading(false);
    };

    checkWahooConnection();
    
    // Listen for connection changes from WahooConnectButton
    const handleConnectionChange = (event: StorageEvent) => {
      if (event.key === "wahoo_token") {
        setIsConnected(!!event.newValue);
      }
    };
    
    window.addEventListener("storage", handleConnectionChange);
    
    return () => {
      window.removeEventListener("storage", handleConnectionChange);
    };
  }, []);

  // Fetch Wahoo activities
  useEffect(() => {
    const fetchWahooActivities = async () => {
      if (!isConnected) {
        return;
      }

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

    if (isConnected) {
      fetchWahooActivities();
    }
  }, [isConnected, toast]);

  return {
    isConnected,
    isLoading,
    activities,
    syncStatus: isConnected ? "connected" : "disconnected",
  };
}
