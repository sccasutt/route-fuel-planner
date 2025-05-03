
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
        .limit(50);

      if (error) {
        console.error(`[${hookId}] Error fetching routes:`, error);
        throw error;
      }
      
      console.log(`[${hookId}] Database response:`, data ? `${data.length} records` : 'No data');
      
      if (!data || data.length === 0) {
        console.log(`[${hookId}] No activities found for user`, userId);
        setActivities([]);
      } else {
        console.log(`[${hookId}] Retrieved ${data.length} activities for user`, userId);
        
        // Convert the data to the correct type to match WahooActivityData
        const typedActivities: WahooActivityData[] = data.map((r: any) => {
          // Debug log the first item to see its structure
          if (data.indexOf(r) === 0) {
            console.log(`[${hookId}] Sample route data:`, r);
          }
          
          return {
            id: r.id || r.wahoo_route_id || `route-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: r.name || "Unnamed Activity",
            date: r.date ? new Date(r.date).toLocaleDateString() : new Date().toLocaleDateString(),
            distance: parseFloat(typeof r.distance === 'string' ? r.distance : r.distance?.toString() || '0'),
            elevation: parseFloat(typeof r.elevation === 'string' ? r.elevation : r.elevation?.toString() || '0'),
            duration: r.duration || "0h 0m",
            calories: r.calories || 0,
          };
        });
        
        console.log(`[${hookId}] Processed ${typedActivities.length} activities`);
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
