
import { updateRouteEnergyData } from "./energyProcessing";

/**
 * Process multiple routes in batch
 */
export async function processRouteBatch(routeIds: string[]): Promise<{ 
  success: number; 
  failed: number; 
}> {
  if (!routeIds || routeIds.length === 0) {
    return { success: 0, failed: 0 };
  }
  
  let success = 0;
  let failed = 0;
  
  // Process each route in sequence
  for (const routeId of routeIds) {
    try {
      // Update energy data
      const energyResult = await updateRouteEnergyData(routeId);
      if (energyResult) {
        success++;
      } else {
        failed++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error(`Error processing route ${routeId}:`, err);
      failed++;
    }
  }
  
  return { success, failed };
}
