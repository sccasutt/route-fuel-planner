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
        console.log(`[${hookId}] Sample raw data:`, data[0]);
        
        // Improved conversion logic with more robust parsing
        const typedActivities: WahooActivityData[] = data.map((r: any) => {
          // Handle distance with better numeric parsing
          let distance = 0;
          if (typeof r.distance === 'number') {
            distance = r.distance;
          } else if (typeof r.distance === 'string') {
            const parsed = parseFloat(r.distance);
            distance = !isNaN(parsed) ? parsed : 0;
          }
          
          // Handle elevation with better numeric parsing
          let elevation = 0;
          if (typeof r.elevation === 'number') {
            elevation = r.elevation;
          } else if (typeof r.elevation === 'string') {
            const parsed = parseFloat(r.elevation);
            elevation = !isNaN(parsed) ? parsed : 0;
          }
          
          // Handle calories with better numeric parsing
          let calories = 0;
          if (typeof r.calories === 'number') {
            calories = r.calories;
          } else if (typeof r.calories === 'string') {
            const parsed = parseInt(r.calories, 10);
            calories = !isNaN(parsed) ? parsed : 0;
          }
          
          // Format duration properly
          let duration = r.duration || "0:00:00";
          
          // Ensure we have a valid date
          let dateStr = r.date;
          if (!(dateStr instanceof Date) && typeof dateStr === 'string') {
            try {
              // Try to parse as ISO date
              const dateObj = new Date(dateStr);
              if (!isNaN(dateObj.getTime())) {
                // Valid date, keep as is
                dateStr = dateObj.toISOString().split('T')[0];
              }
            } catch (e) {
              console.error(`[${hookId}] Error parsing date:`, e);
              dateStr = new Date().toISOString().split('T')[0];
            }
          }
          
          // Create properly typed activity object with sanitized data
          const activity: WahooActivityData = {
            id: r.id || r.wahoo_route_id || `route-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: r.name || "Unnamed Activity",
            date: dateStr,
            distance: distance,
            elevation: elevation,
            duration: duration,
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
