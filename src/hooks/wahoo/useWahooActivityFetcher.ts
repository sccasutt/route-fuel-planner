
/**
 * Hook to fetch Wahoo activities from the database
 */

import { useState, useEffect, useCallback } from "react";
import { WahooActivityData } from "./wahooTypes";
import { useWahooActivityDatabase } from "./useWahooActivityDatabase";

export function useWahooActivityFetcher() {
  const [activities, setActivities] = useState<WahooActivityData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchActivitiesFromDB } = useWahooActivityDatabase();

  const fetchWahooActivities = useCallback(async (userId: string, hookId = "default") => {
    if (!userId) {
      console.log(`[${hookId}] No user ID provided, cannot fetch activities`);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[${hookId}] Fetching Wahoo activities for user:`, userId);
      
      const fetchedActivities = await fetchActivitiesFromDB(userId, hookId);
      
      console.log(`[${hookId}] Fetched ${fetchedActivities.length} activities`);
      setActivities(fetchedActivities);
      
      return fetchedActivities;
    } catch (err: any) {
      const errMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`[${hookId}] Error fetching activities:`, err);
      setError(errMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [fetchActivitiesFromDB]);

  return {
    activities,
    isLoading,
    error,
    fetchWahooActivities
  };
}
