
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
        
        // Try to diagnose why no data is found with additional checks
        const { count: diagnosticCount, error: countError } = await supabase
          .from('routes')
          .select('*', { count: 'exact', head: true });
        
        console.log(`[${hookId}] Total routes in database:`, countError ? 'Error' : diagnosticCount);
        
        if (countError) {
          console.error(`[${hookId}] Error checking total routes:`, countError);
        }
        
        // Check if routes table exists by querying another table
        const { data: tableData, error: tableError } = await supabase
          .from('wahoo_profiles')
          .select('count(*)')
          .single();
        
        if (tableError) {
          console.error(`[${hookId}] Error checking tables:`, tableError);
        } else {
          console.log(`[${hookId}] wahoo_profiles table exists and contains data:`, tableData);
        }
        
        // Also check wahoo_profiles to see if there's any record of this user
        const { data: wahooProfile } = await supabase
          .from('wahoo_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        console.log(`[${hookId}] Wahoo profile for user:`, wahooProfile || 'Not found');
        
        setActivities([]);
      } else {
        console.log(`[${hookId}] Retrieved ${data.length} activities for user`, userId);
        
        // Convert the data to the correct type to match WahooActivityData
        const typedActivities: WahooActivityData[] = data.map((r: any) => {
          // Debug log the first item to see its structure
          if (data.indexOf(r) === 0) {
            console.log(`[${hookId}] Sample route data:`, r);
          }
          
          // Make sure to handle all data types correctly
          const activity: WahooActivityData = {
            id: r.id || r.wahoo_route_id || `route-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: r.name || "Unnamed Activity",
            date: r.date ? new Date(r.date).toLocaleDateString() : new Date().toLocaleDateString(),
            distance: parseFloat(typeof r.distance === 'string' ? r.distance : (r.distance?.toString() || '0')),
            elevation: parseFloat(typeof r.elevation === 'string' ? r.elevation : (r.elevation?.toString() || '0')),
            duration: r.duration || "0h 0m",
            calories: r.calories || 0,
          };
          
          return activity;
        });
        
        console.log(`[${hookId}] Processed ${typedActivities.length} activities`);
        
        if (typedActivities.length > 0) {
          console.log(`[${hookId}] First activity:`, typedActivities[0]);
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
