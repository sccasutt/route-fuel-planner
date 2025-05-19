
import { WahooSyncResult } from "@/components/Wahoo/WahooSyncApi";
import { syncWahooProfileAndRoutes } from "@/components/Wahoo/WahooSyncApi";
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
    const result = await syncWahooProfileAndRoutes();
    return result;
  } catch (error) {
    console.error("Error during Wahoo sync:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: message
    };
  }
}
