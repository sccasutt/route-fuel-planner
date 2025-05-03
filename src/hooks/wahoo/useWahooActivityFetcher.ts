
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

      // Using RLS policies to get only routes for the current user
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(10);

      if (error) {
        console.error(`[${hookId}] Error fetching routes:`, error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log(`[${hookId}] No activities found for user`, userId);
        setActivities([]);
      } else {
        console.log(`[${hookId}] Retrieved ${data.length} activities for user`, userId);
        
        // Convert the data to the correct type to match WahooActivityData
        const typedActivities: WahooActivityData[] = data.map((r: any) => ({
          id: r.id,
          name: r.name || "Unnamed Activity",
          date: r.date ? new Date(r.date).toLocaleDateString() : new Date().toLocaleDateString(),
          distance: typeof r.distance === 'string' ? parseFloat(r.distance) : r.distance || 0,
          elevation: typeof r.elevation === 'string' ? parseFloat(r.elevation) : r.elevation || 0,
          duration: r.duration || "0h 0m",
          calories: r.calories || 0,
        }));
        
        setActivities(typedActivities);
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
