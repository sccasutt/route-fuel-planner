
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WahooActivityData } from "./wahooTypes";

export function useWahooActivityFetcher() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activities, setActivities] = useState<WahooActivityData[]>([]);
  const { toast } = useToast();

  const fetchWahooActivities = useCallback(async (userId: string, hookId: string) => {
    if (!userId) {
      console.log(`[${hookId}] No user found, not fetching activities`);
      setActivities([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      console.log(`[${hookId}] Fetching Wahoo activities for user`, userId);

      // First check if the wahoo_profiles table has a record for this user
      const { data: profileData, error: profileError } = await supabase
        .from('wahoo_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.log(`[${hookId}] No Wahoo profile found for user ${userId}:`, profileError);
      } else {
        console.log(`[${hookId}] Found Wahoo profile:`, {
          userId: profileData.id,
          wahooUserId: profileData.wahoo_user_id,
          lastSynced: profileData.last_synced_at
        });
      }

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
          // Handle numeric data properly
          let distance = 0;
          try {
            distance = typeof r.distance === 'number' 
              ? r.distance 
              : typeof r.distance === 'string' 
                ? parseFloat(r.distance) 
                : 0;

            // Ensure it's a valid number
            if (isNaN(distance)) distance = 0;
          } catch (e) {
            console.error(`[${hookId}] Error parsing distance:`, e);
          }
          
          let elevation = 0;
          try {
            elevation = typeof r.elevation === 'number' 
              ? r.elevation 
              : typeof r.elevation === 'string' 
                ? parseFloat(r.elevation) 
                : 0;
                
            // Ensure it's a valid number
            if (isNaN(elevation)) elevation = 0;
          } catch (e) {
            console.error(`[${hookId}] Error parsing elevation:`, e);
          }
          
          let calories = 0;
          try {
            calories = typeof r.calories === 'number' 
              ? r.calories 
              : typeof r.calories === 'string' 
                ? parseInt(r.calories, 10) 
                : 0;
                
            // Ensure it's a valid number
            if (isNaN(calories)) calories = 0;
          } catch (e) {
            console.error(`[${hookId}] Error parsing calories:`, e);
          }
          
          // Create properly typed activity object
          const activity: WahooActivityData = {
            id: r.id || r.wahoo_route_id || `route-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: r.name || "Unnamed Activity",
            date: r.date ? new Date(r.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            distance: distance,
            elevation: elevation,
            duration: r.duration || "0h 0m",
            calories: calories,
          };
          
          return activity;
        });
        
        console.log(`[${hookId}] Processed ${typedActivities.length} activities`);
        
        if (typedActivities.length > 0) {
          console.log(`[${hookId}] First processed activity:`, typedActivities[0]);
        }
        
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
  }, [toast]);

  return {
    activities,
    isLoading,
    fetchWahooActivities
  };
}
