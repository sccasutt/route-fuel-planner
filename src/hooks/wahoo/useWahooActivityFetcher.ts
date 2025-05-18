
/**
 * Hook for fetching Wahoo activities
 */

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { WahooActivityData } from "./wahooTypes";
import { useWahooActivityDatabase } from "./useWahooActivityDatabase";

export function useWahooActivityFetcher() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activities, setActivities] = useState<WahooActivityData[]>([]);
  const [lastApiResponse, setLastApiResponse] = useState<any>(null);
  const { toast } = useToast();
  const { fetchActivitiesFromDB, fetchWahooProfile } = useWahooActivityDatabase();
  
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
      const profileData = await fetchWahooProfile(userId, hookId);
      
      // Store the profile response for debugging
      try {
        if (profileData) {
          localStorage.setItem("wahoo_last_profile_response", JSON.stringify(profileData));
        }
      } catch (err) {
        console.warn("Failed to store profile in localStorage:", err);
      }

      // Get activities from database
      const typedActivities = await fetchActivitiesFromDB(userId, hookId);
      
      // Store the raw database response for debugging
      try {
        localStorage.setItem("wahoo_last_db_response", JSON.stringify(typedActivities || []));
        setLastApiResponse(typedActivities || []);
      } catch (err) {
        console.warn("Failed to store DB response in localStorage:", err);
      }
      
      setActivities(typedActivities);
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
  }, [toast, fetchActivitiesFromDB, fetchWahooProfile]);

  return {
    activities,
    isLoading,
    fetchWahooActivities,
    lastApiResponse
  };
}
