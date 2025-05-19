import { syncWahooProfileAndRoutes, WahooSyncResult } from "@/components/Wahoo/WahooSyncApi";
import { useToast } from "@/hooks/use-toast";

// Helper function to format sync results for display
export function formatSyncResults(result: WahooSyncResult): string {
  if (!result.success || !result.data) {
    return "Sync failed. Please try again.";
  }
  
  const routeCount = result.data.routeCount || 0;
  const activityCount = result.data.activityCount || 0;
  
  if (routeCount === 0 && activityCount === 0) {
    return "Sync completed. No new activities found.";
  }
  
  return `Sync completed. Found ${routeCount} routes and ${activityCount} activities.`;
}

// Sync function with proper error handling
export async function performWahooSync(): Promise<WahooSyncResult> {
  try {
    return await syncWahooProfileAndRoutes();
  } catch (error) {
    console.error("Error during Wahoo sync:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

// Check if Wahoo token is about to expire and needs refreshing
export function checkTokenRefreshNeeded(): boolean {
  try {
    const tokenString = localStorage.getItem("wahoo_token");
    if (!tokenString) return false;
    
    const tokenData = JSON.parse(tokenString);
    if (!tokenData.expires_at) return false;
    
    // Check if token expires in less than 30 minutes
    const expiresAt = tokenData.expires_at;
    const thirtyMinutesInMs = 30 * 60 * 1000;
    const needsRefresh = expiresAt - Date.now() < thirtyMinutesInMs;
    
    if (needsRefresh) {
      console.log("Wahoo token needs refreshing, expires at:", new Date(expiresAt).toISOString());
    }
    
    return needsRefresh;
  } catch (error) {
    console.error("Error checking token refresh status:", error);
    return false;
  }
}

// Format activity data for display
export function formatActivityData(activity: any) {
  if (!activity) return null;
  
  try {
    const formattedActivity = {
      id: activity.id || activity.wahoo_route_id || `unknown-${Date.now()}`,
      name: activity.name || "Unnamed Activity",
      date: activity.date || new Date().toISOString(),
      distance: typeof activity.distance === 'number' 
        ? activity.distance >= 1000 ? (activity.distance / 1000).toFixed(2) + ' km' : activity.distance.toFixed(2) + ' m'
        : 'N/A',
      elevation: typeof activity.elevation === 'number' 
        ? activity.elevation.toFixed(0) + ' m' 
        : 'N/A',
      duration: activity.duration || 'N/A',
      calories: typeof activity.calories === 'number' 
        ? activity.calories.toString() 
        : 'N/A'
    };
    
    return formattedActivity;
  } catch (error) {
    console.error("Error formatting activity data:", error);
    return null;
  }
}
