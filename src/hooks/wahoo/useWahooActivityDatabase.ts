
/**
 * Hook for Wahoo activity database operations
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WahooActivityData } from "./wahooTypes";
import { processActivityData } from "./activityFormatUtils";

export function useWahooActivityDatabase() {
  /**
   * Fetches activities for a user from the database
   */
  const fetchActivitiesFromDB = useCallback(async (userId: string, hookId: string) => {
    try {
      console.log(`[${hookId}] Fetching activities from database for user`, userId);
      
      // Using RLS policies to get only routes for the current user
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          route_weather(*)
        `)
        .eq("user_id", userId as any)
        .order("date", { ascending: false })
        .limit(100); // Increased limit to get more recent activities

      if (error) {
        console.error(`[${hookId}] Error fetching routes:`, error);
        throw error;
      }
      
      console.log(`[${hookId}] Database response:`, data ? `${data.length} records` : 'No data');
      
      if (!data || data.length === 0) {
        console.log(`[${hookId}] No activities found for user`, userId);
        return [];
      }
      
      console.log(`[${hookId}] Retrieved ${data.length} activities for user`, userId);
      if (data.length > 0) {
        console.log(`[${hookId}] First raw activity:`, data[0]);
        
        // More detailed logging for the gpx_data field
        const firstActivity = data[0];
        if (firstActivity && firstActivity.gpx_data) {
          console.log(`[${hookId}] gpx_data type:`, typeof firstActivity.gpx_data);
          console.log(`[${hookId}] gpx_data sample:`, 
            typeof firstActivity.gpx_data === 'string' 
              ? firstActivity.gpx_data.substring(0, 100) + '...' 
              : JSON.stringify(firstActivity.gpx_data).substring(0, 100) + '...');
          
          // Try to parse it
          try {
            const parsedData = typeof firstActivity.gpx_data === 'string' 
              ? JSON.parse(firstActivity.gpx_data) 
              : firstActivity.gpx_data;
            
            console.log(`[${hookId}] gpx_data parsed successfully:`, 
              parsedData?.coordinates?.length || 0, 
              'coordinates found');
              
            if (parsedData?.coordinates?.length > 0) {
              console.log(`[${hookId}] First coordinate:`, parsedData.coordinates[0]);
            }
          } catch (err) {
            console.log(`[${hookId}] gpx_data is not valid JSON:`, err);
          }
        } else {
          console.log(`[${hookId}] No gpx_data found in route`);
        }
      }
      
      // Process raw data into typed activities
      const typedActivities: WahooActivityData[] = data.map(item => processActivityData(item));
      
      console.log(`[${hookId}] Processed ${typedActivities.length} activities`);
      
      if (typedActivities.length > 0) {
        console.log(`[${hookId}] First processed activity:`, typedActivities[0]);
      }
      
      return typedActivities;
    } catch (error) {
      console.error(`[${hookId}] Error in fetchActivitiesFromDB:`, error);
      throw error;
    }
  }, []);

  /**
   * Fetches Wahoo profile data for a user
   */
  const fetchWahooProfile = useCallback(async (userId: string, hookId: string) => {
    try {
      console.log(`[${hookId}] Fetching Wahoo profile for user`, userId);
      const { data, error } = await supabase
        .from('wahoo_profiles')
        .select('*')
        .eq('id', userId as any)
        .single();
      
      if (error) {
        console.log(`[${hookId}] No Wahoo profile found for user ${userId}:`, error);
        return null;
      }
      
      if (!data) {
        console.log(`[${hookId}] No data returned for Wahoo profile`);
        return null;
      }
      
      console.log(`[${hookId}] Found Wahoo profile:`, {
        userId: data?.id,
        wahooUserId: data?.wahoo_user_id,
        lastSynced: data?.last_synced_at
      });
      
      return data;
    } catch (error) {
      console.error(`[${hookId}] Error in fetchWahooProfile:`, error);
      return null;
    }
  }, []);

  /**
   * Fetches a single route by ID
   */
  const fetchRouteById = useCallback(async (routeId: string, hookId: string) => {
    try {
      console.log(`[${hookId}] Fetching route by ID:`, routeId);
      
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          route_weather(*)
        `)
        .eq('id', routeId as any)
        .single();
      
      if (error) {
        console.error(`[${hookId}] Error fetching route by ID:`, error);
        return null;
      }
      
      if (!data) {
        console.log(`[${hookId}] No route found with ID:`, routeId);
        return null;
      }
      
      console.log(`[${hookId}] Found route:`, data);
      return processActivityData(data);
    } catch (error) {
      console.error(`[${hookId}] Error in fetchRouteById:`, error);
      return null;
    }
  }, []);

  return {
    fetchActivitiesFromDB,
    fetchWahooProfile,
    fetchRouteById
  };
}
