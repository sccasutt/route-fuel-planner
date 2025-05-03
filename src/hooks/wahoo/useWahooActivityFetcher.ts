
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WahooActivityData } from "./wahooTypes";

export function useWahooActivityFetcher() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activities, setActivities] = useState<WahooActivityData[]>([]);
  const { toast } = useToast();

  const fetchWahooActivities = async (userId: string, hookId: string) => {
    if (!userId) {
      console.log(`[${hookId}] No user found, not fetching activities`);
      setActivities([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      console.log(`[${hookId}] Fetching Wahoo activities for user`, userId);
      
      // Get Wahoo user ID from token if available
      let wahooUserId = null;
      try {
        const tokenString = localStorage.getItem("wahoo_token");
        if (tokenString) {
          const tokenData = JSON.parse(tokenString);
          wahooUserId = tokenData.wahoo_user_id;
          console.log(`[${hookId}] Using Wahoo user ID from token:`, wahooUserId);
        }
      } catch (e) {
        console.error(`[${hookId}] Error getting Wahoo user ID from token:`, e);
      }
      
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log(`[${hookId}] No activities found for user`, userId);
        setActivities([]);
      } else {
        console.log(`[${hookId}] Retrieved ${data.length} activities for user`, userId);
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
      console.error(`[${hookId}] Error fetching Wahoo activities:`, error);
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
    activities,
    isLoading,
    fetchWahooActivities
  };
}
