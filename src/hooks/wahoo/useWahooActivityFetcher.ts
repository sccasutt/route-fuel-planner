
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WahooActivityData } from "./wahooTypes";

export function useWahooActivityFetcher() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activities, setActivities] = useState<WahooActivityData[]>([]);
  const [lastApiResponse, setLastApiResponse] = useState<any>(null);
  const { toast } = useToast();
  
  // Helper function to format duration for consistency
  const formatDurationString = (duration: string): string => {
    if (!duration) return "0:00:00";
    
    // Make sure the duration is in HH:MM:SS format
    const parts = duration.split(':');
    if (parts.length === 1) {
      // Just seconds
      const seconds = parseInt(parts[0], 10) || 0;
      if (seconds === 0) {
        // Default to 1 minute if duration is zero
        return "0:01:00";
      }
      return `0:00:${parts[0].padStart(2, '0')}`;
    } else if (parts.length === 2) {
      return `0:${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    } else if (parts.length === 3) {
      return `${parts[0]}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
    }
    return "0:01:00"; // Default to 1 minute
  };

  // Helper function to convert seconds to HH:MM:SS format
  const secondsToTimeString = (seconds: number): string => {
    if (!seconds || seconds <= 0) return "0:01:00"; // Default to 1 minute if no valid value
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
        
        // Store the profile response for debugging
        try {
          localStorage.setItem("wahoo_last_profile_response", JSON.stringify(profileData));
        } catch (err) {
          console.warn("Failed to store profile in localStorage:", err);
        }
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
      
      // Store the raw database response for debugging
      try {
        localStorage.setItem("wahoo_last_db_response", JSON.stringify(data || []));
        setLastApiResponse(data || []);
      } catch (err) {
        console.warn("Failed to store DB response in localStorage:", err);
      }
      
      if (!data || data.length === 0) {
        console.log(`[${hookId}] No activities found for user`, userId);
        setActivities([]);
      } else {
        console.log(`[${hookId}] Retrieved ${data.length} activities for user`, userId);
        if (data.length > 0) {
          console.log(`[${hookId}] First raw activity:`, data[0]);
        }
        
        // Improved conversion logic with more robust parsing
        const typedActivities: WahooActivityData[] = data.map((r: any) => {
          // Ensure we're working with clean numeric values
          
          // Handle distance
          let distance = 0;
          if (typeof r.distance === 'number' && !isNaN(r.distance)) {
            distance = r.distance;
          } else if (typeof r.distance === 'string') {
            const parsed = parseFloat(r.distance);
            distance = !isNaN(parsed) ? parsed : 0;
          }
          
          // Handle elevation
          let elevation = 0;
          if (typeof r.elevation === 'number' && !isNaN(r.elevation)) {
            elevation = r.elevation;
          } else if (typeof r.elevation === 'string') {
            const parsed = parseFloat(r.elevation);
            elevation = !isNaN(parsed) ? parsed : 0;
          }
          
          // Handle calories
          let calories = 0;
          if (typeof r.calories === 'number' && !isNaN(r.calories)) {
            calories = r.calories;
          } else if (typeof r.calories === 'string') {
            const parsed = parseInt(r.calories, 10);
            calories = !isNaN(parsed) ? parsed : 0;
          }
          
          // Handle numeric duration_seconds first if available
          let duration;
          let durationSeconds = r.duration_seconds;
          
          if (typeof durationSeconds === 'number' && durationSeconds > 0) {
            // We have seconds, convert to HH:MM:SS
            duration = secondsToTimeString(durationSeconds);
          } else {
            // Fall back to text-based duration with validation
            if (r.duration === null || r.duration === undefined) {
              duration = "0:01:00"; // Default 1 minute
              durationSeconds = 60;
            } else if (r.duration === "0" || r.duration === "0s" || r.duration === "0:00:00" || r.duration === 0) {
              duration = "0:01:00"; // Use 1 minute instead of zero
              durationSeconds = 60;
            } else if (typeof r.duration === 'string') {
              // Format consistently to HH:MM:SS
              duration = formatDurationString(r.duration);
              // Try to convert text duration to seconds
              const parts = duration.split(':');
              if (parts.length === 3) {
                durationSeconds = parseInt(parts[0], 10) * 3600 + 
                                 parseInt(parts[1], 10) * 60 + 
                                 parseInt(parts[2], 10);
              }
            } else if (typeof r.duration === 'number') {
              // Convert seconds to HH:MM:SS
              if (r.duration <= 0) {
                duration = "0:01:00"; // Use 1 minute instead of zero
                durationSeconds = 60;
              } else {
                durationSeconds = r.duration;
                duration = secondsToTimeString(durationSeconds);
              }
            } else {
              duration = "0:01:00"; // Default 1 minute
              durationSeconds = 60;
            }
          }
          
          // Ensure duration_seconds is never zero or negative
          if (durationSeconds <= 0) {
            durationSeconds = 60;
            duration = "0:01:00";
          }
          
          // Format date
          let dateStr = r.date;
          if (dateStr) {
            try {
              // Try to parse as ISO date
              const dateObj = new Date(dateStr);
              if (!isNaN(dateObj.getTime())) {
                // Valid date
                dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
              }
            } catch (e) {
              console.error(`[${hookId}] Error parsing date:`, e);
              dateStr = new Date().toISOString().split('T')[0];
            }
          } else {
            dateStr = new Date().toISOString().split('T')[0];
          }
          
          // Create properly typed activity object with sanitized data
          const activity: WahooActivityData = {
            id: r.id || r.wahoo_route_id || `route-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: r.name || "Unnamed Activity",
            date: dateStr,
            distance: distance,
            elevation: elevation,
            duration: duration,
            duration_seconds: durationSeconds,
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
    fetchWahooActivities,
    lastApiResponse
  };
}
