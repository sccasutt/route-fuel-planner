
/**
 * Constants for energy calculations
 */
const CONSTANTS = {
  // Calories in 1 watt-hour (standard approximation for cycling)
  WATT_HOUR_TO_KCAL: 0.24,
  
  // Efficiency factor (muscular to mechanical conversion)
  EFFICIENCY_FACTOR: 0.23,
  
  // Standard rolling resistance coefficient
  ROLLING_RESISTANCE: 0.005,
  
  // Drag coefficient for average cyclist
  DRAG_COEFFICIENT: 0.7,
  
  // Frontal area of cyclist (m²)
  FRONTAL_AREA: 0.5,
  
  // Air density at sea level (kg/m³)
  AIR_DENSITY: 1.225,
  
  // Gravity (m/s²)
  GRAVITY: 9.81,
  
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
 * Calculate calories from average power and duration
 * @param avgPower Average power in watts
 * @param durationSeconds Duration in seconds
 * @returns Calories burned (kcal)
 */
export function calculateCaloriesFromPower(
  avgPower: number, 
  durationSeconds: number
): number {
  if (!avgPower || !durationSeconds || avgPower <= 0 || durationSeconds <= 0) {
    return 0;
  }
  
  const durationHours = durationSeconds / 3600;
  return (avgPower * durationHours * CONSTANTS.WATT_HOUR_TO_KCAL);
}

/**
 * Calculate calories based on physical factors (distance, elevation, wind)
 * @param distance Distance in kilometers
 * @param elevation Elevation gain in meters
 * @param durationSeconds Duration in seconds
 * @param weight Rider weight in kg (default 75kg)
 * @param windSpeedMs Wind speed in m/s
 * @param windDirectionDeg Wind direction in degrees
 * @returns Estimated calories burned (kcal)
 */
export function estimateCaloriesFromPhysics(
  distance: number,
  elevation: number,
  durationSeconds: number,
  weight: number = 75,
  windSpeedMs: number = 0,
  windDirectionDeg: number = 0
): number {
  if (!distance || distance <= 0 || !durationSeconds || durationSeconds <= 0) {
    return 0;
  }
  
  const distanceMeters = distance * 1000;
  const avgSpeedMs = distanceMeters / durationSeconds;
  
  // Calculate rolling resistance energy (Joules)
  const rollingEnergy = CONSTANTS.ROLLING_RESISTANCE * weight * CONSTANTS.GRAVITY * distanceMeters;
  
  // Calculate climbing energy (Joules)
  const climbingEnergy = weight * CONSTANTS.GRAVITY * elevation;
  
  // Calculate aerodynamic drag with wind consideration
  // Convert wind direction to radians and calculate effective wind component
  const windDirectionRad = (windDirectionDeg * Math.PI) / 180;
  const effectiveWindSpeed = Math.cos(windDirectionRad) * windSpeedMs;
  const relativeWindSpeed = avgSpeedMs - effectiveWindSpeed;
  
  // Aerodynamic drag energy (Joules)
  const aerodynamicEnergy = 0.5 * CONSTANTS.AIR_DENSITY * CONSTANTS.DRAG_COEFFICIENT * 
    CONSTANTS.FRONTAL_AREA * (relativeWindSpeed * relativeWindSpeed) * distanceMeters;
  
  // Total energy in Joules
  const totalEnergyJoules = (rollingEnergy + climbingEnergy + aerodynamicEnergy);
  
  // Convert to calories using efficiency factor
  return totalEnergyJoules / (4.184 * CONSTANTS.EFFICIENCY_FACTOR);
}

/**
 * Calculate macronutrients from total calories
 * @param totalCalories Total calories burned
 * @returns Object containing grams of fat, carbs, and protein
 */
export function calculateMacronutrients(totalCalories: number): {
  fatGrams: number;
  carbGrams: number;
  proteinGrams: number;
} {
  if (!totalCalories || totalCalories <= 0) {
    return {
      fatGrams: 0,
      carbGrams: 0,
      proteinGrams: 0
    };
  }
  
  const fatGrams = (totalCalories * CONSTANTS.FAT_PERCENTAGE) / CONSTANTS.CAL_PER_GRAM_FAT;
  const carbGrams = (totalCalories * CONSTANTS.CARB_PERCENTAGE) / CONSTANTS.CAL_PER_GRAM_CARB;
  const proteinGrams = (totalCalories * CONSTANTS.PROTEIN_PERCENTAGE) / CONSTANTS.CAL_PER_GRAM_PROTEIN;
  
  return {
    fatGrams: Math.round(fatGrams * 10) / 10, // Round to 1 decimal place
    carbGrams: Math.round(carbGrams * 10) / 10,
    proteinGrams: Math.round(proteinGrams * 10) / 10
  };
}

/**
 * Process route data to estimate energy and macronutrients
 */
export async function processRouteEnergyData(routeData: any): Promise<{
  caloriesPowerBased: number | null;
  caloriesEstimated: number;
  macronutrients: {
    fatGrams: number;
    carbGrams: number;
    proteinGrams: number;
  };
}> {
  // Extract base route data
  const distance = routeData.distance || 0;
  const elevation = routeData.elevation || 0;
  const durationSeconds = routeData.duration_seconds || 0;
  
  // Get wind data if available
  let windSpeed = 0;
  let windDirection = 0;
  
  if (routeData.weather_json?.wind_data?.length) {
    const windData = routeData.weather_json.wind_data;
    // Use average wind data for simplicity
    windSpeed = windData.reduce((sum: number, data: any) => sum + data.speed, 0) / windData.length;
    windDirection = windData.reduce((sum: number, data: any) => sum + data.direction, 0) / windData.length;
  }
  
  // Calculate power-based calories if power data is available
  let caloriesPowerBased = null;
  if (routeData.average_power && routeData.average_power > 0) {
    caloriesPowerBased = calculateCaloriesFromPower(routeData.average_power, durationSeconds);
  }
  
  // Calculate physics-based estimate
  const caloriesEstimated = estimateCaloriesFromPhysics(
    distance,
    elevation,
    durationSeconds,
    routeData.rider_weight || 75,
    windSpeed,
    windDirection
  );
  
  // Use power-based calories if available, otherwise use estimated
  const totalCalories = caloriesPowerBased || caloriesEstimated;
  
  // Calculate macronutrients
  const macronutrients = calculateMacronutrients(totalCalories);
  
  return {
    caloriesPowerBased,
    caloriesEstimated,
    macronutrients
  };
}

/**
 * Update a route's energy and macronutrient data in the database
 */
export async function updateRouteEnergyData(routeId: string): Promise<boolean> {
  try {
    // First fetch the route data
    const { data: routeData, error: fetchError } = await supabase
      .from('routes')
      .select('*')
      .eq('id', routeId)
      .single();
      
    if (fetchError || !routeData) {
      console.error("Error fetching route data:", fetchError);
      return false;
    }
    
    // Process energy data
    const { 
      caloriesPowerBased, 
      caloriesEstimated, 
      macronutrients 
    } = await processRouteEnergyData(routeData);
    
    // Update the route with calculated values
    const { error: updateError } = await supabase
      .from('routes')
      .update({
        calories_power_based: caloriesPowerBased,
        calories_estimated: caloriesEstimated,
        fat_grams: macronutrients.fatGrams,
        carb_grams: macronutrients.carbGrams,
        protein_grams: macronutrients.proteinGrams
      })
      .eq('id', routeId);
      
    if (updateError) {
      console.error("Error updating route energy data:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateRouteEnergyData:", error);
    return false;
  }
}
