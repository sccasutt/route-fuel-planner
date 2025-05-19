
import { supabase } from "@/integrations/supabase/client";
import { calculateCaloriesFromPower, estimateCaloriesFromPhysics } from "../lib/calculationUtils";

/**
 * Constants for macronutrient calculations
 */
const MACRONUTRIENT_CONSTANTS = {
  // Calories per gram of macronutrients
  CAL_PER_GRAM_FAT: 9,
  CAL_PER_GRAM_CARB: 4,
  CAL_PER_GRAM_PROTEIN: 4,
  
  // Macronutrient breakdown for typical cycling effort
  FAT_PERCENTAGE: 0.3,
  CARB_PERCENTAGE: 0.65,
  PROTEIN_PERCENTAGE: 0.05
};

/**
 * Calculate macronutrient requirements based on total calories
 */
export function calculateMacronutrients(totalCalories: number) {
  if (!totalCalories || totalCalories <= 0) {
    return { fatGrams: 0, carbGrams: 0, proteinGrams: 0 };
  }
  
  const fatCalories = totalCalories * MACRONUTRIENT_CONSTANTS.FAT_PERCENTAGE;
  const carbCalories = totalCalories * MACRONUTRIENT_CONSTANTS.CARB_PERCENTAGE;
  const proteinCalories = totalCalories * MACRONUTRIENT_CONSTANTS.PROTEIN_PERCENTAGE;
  
  const fatGrams = Math.round(fatCalories / MACRONUTRIENT_CONSTANTS.CAL_PER_GRAM_FAT);
  const carbGrams = Math.round(carbCalories / MACRONUTRIENT_CONSTANTS.CAL_PER_GRAM_CARB);
  const proteinGrams = Math.round(proteinCalories / MACRONUTRIENT_CONSTANTS.CAL_PER_GRAM_PROTEIN);
  
  return { fatGrams, carbGrams, proteinGrams };
}

/**
 * Update a route's energy and macronutrient data
 */
export async function updateRouteEnergyData(routeId: string): Promise<boolean> {
  try {
    // Fetch route data
    const { data: routeData, error } = await supabase
      .from('routes')
      .select('*')
      .eq('id', routeId)
      .single();
      
    if (error || !routeData) {
      console.error("Error fetching route for energy calculation:", error);
      return false;
    }
    
    // Extract or calculate required values
    // Use type assertion for properties that TypeScript doesn't recognize
    const avgPower = routeData?.average_power || (routeData as any)?.avg_power;
    const durationSeconds = routeData.duration_seconds || 0;
    const distance = routeData.distance || 0;
    const elevation = routeData.elevation || 0;
    
    // Calculate calories from power if available
    let caloriesPowerBased = null;
    if (avgPower && durationSeconds) {
      caloriesPowerBased = calculateCaloriesFromPower(avgPower, durationSeconds);
    }
    
    // Calculate estimated calories if no power data
    let caloriesEstimated = null;
    if (!avgPower && distance > 0) {
      // Get wind data if available
      const weatherJson = routeData.weather_json || {};
      
      // Safely access wind_data with type checking
      const windData = typeof weatherJson === 'object' && weatherJson !== null 
        ? (weatherJson as any).wind_data || [] 
        : [];
      
      const avgWindSpeed = windData.length > 0 
        ? windData.reduce((sum: number, item: any) => sum + item.speed, 0) / windData.length 
        : 0;
      const avgWindDirection = windData.length > 0
        ? windData.reduce((sum: number, item: any) => sum + item.direction, 0) / windData.length
        : 0;
        
      caloriesEstimated = estimateCaloriesFromPhysics(
        distance, 
        elevation, 
        durationSeconds,
        (routeData as any).rider_weight || 75,
        avgWindSpeed,
        avgWindDirection
      );
    }
    
    // Use existing calories if no calculation possible
    if (!caloriesPowerBased && !caloriesEstimated) {
      caloriesEstimated = routeData.calories || 0;
    }
    
    // Calculate total calories (prioritize power-based)
    const totalCalories = caloriesPowerBased || caloriesEstimated || 0;
    
    // Calculate macronutrients
    const { fatGrams, carbGrams, proteinGrams } = calculateMacronutrients(totalCalories);
    
    // Update route with calculated values
    const { error: updateError } = await supabase
      .from('routes')
      .update({
        calories_power_based: caloriesPowerBased,
        calories_estimated: caloriesEstimated,
        fat_grams: fatGrams,
        carb_grams: carbGrams,
        protein_grams: proteinGrams
      })
      .eq('id', routeId);
      
    if (updateError) {
      console.error("Error updating route energy data:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in energy calculation:", error);
    return false;
  }
}
