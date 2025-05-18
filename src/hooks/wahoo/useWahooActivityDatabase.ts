
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
        return [];
      }
      
      console.log(`[${hookId}] Retrieved ${data.length} activities for user`, userId);
      if (data.length > 0) {
        console.log(`[${hookId}] First raw activity:`, data[0]);
      }
      
      // Process raw data into typed activities
      const typedActivities: WahooActivityData[] = data.map(processActivityData);
      
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
        .eq('id', userId)
        .single();
      
      if (error) {
        console.log(`[${hookId}] No Wahoo profile found for user ${userId}:`, error);
        return null;
      }
      
      console.log(`[${hookId}] Found Wahoo profile:`, {
        userId: data.id,
        wahooUserId: data.wahoo_user_id,
        lastSynced: data.last_synced_at
      });
      
      return data;
    } catch (error) {
      console.error(`[${hookId}] Error in fetchWahooProfile:`, error);
      return null;
    }
  }, []);

  return {
    fetchActivitiesFromDB,
    fetchWahooProfile
  };
}
