
/**
 * Calculate BMI (Body Mass Index)
 * @param weight Weight in kg
 * @param height Height in cm
 */
export function calculateBMI(weight: number, height: number): number {
  // Weight in kg, height in cm
  if (weight <= 0 || height <= 0) return 0;
  return weight / Math.pow(height / 100, 2);
}

/**
 * Get BMI category based on BMI value
 */
export function getBMICategory(bmi: number): string {
  if (bmi <= 0) return 'Unknown';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Calculate daily calorie needs
 * @param weight Weight in kg
 * @param height Height in cm
 * @param age Age in years
 * @param gender 'male' or 'female'
 * @param activityLevel Activity level description
 */
export function calculateCalories(weight: number, height: number, age: number, gender: string, activityLevel: string): number {
  // BMR calculation using Mifflin-St Jeor Equation
  if (weight <= 0 || height <= 0 || age <= 0) return 0;
  
  let bmr = 0;
  if (gender.toLowerCase() === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  // Activity multiplier
  const activityMultipliers: Record<string, number> = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very_active': 1.9
  };
  
  const multiplier = activityMultipliers[activityLevel.toLowerCase()] || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate calories burned based on average power and duration
 * @param avgPower Average power in watts
 * @param durationSeconds Duration in seconds
 * @returns Calories burned
 */
export function calculateCaloriesFromPower(avgPower: number, durationSeconds: number): number {
  if (!avgPower || !durationSeconds || avgPower <= 0 || durationSeconds <= 0) {
    return 0;
  }
  
  // Standard formula: (avg_power * duration_sec * 0.24) / 3600
  return (avgPower * durationSeconds * 0.24) / 3600;
}

/**
 * Estimate calories burned based on physics calculations for cycling
 * @param distance Distance in km
 * @param elevation Elevation gain in meters
 * @param durationSeconds Duration in seconds
 * @param riderWeight Rider weight in kg
 * @param windSpeed Wind speed in m/s
 * @param windDirection Wind direction in degrees
 * @returns Calories burned
 */
export function estimateCaloriesFromPhysics(
  distance: number, 
  elevation: number, 
  durationSeconds: number,
  riderWeight: number = 75, 
  windSpeed: number = 0,
  windDirection: number = 0
): number {
  if (!distance || distance <= 0) {
    return 0;
  }
  
  // Convert distance to meters
  const distanceMeters = distance * 1000;
  
  // Calculate average speed in m/s
  const speedMps = durationSeconds > 0 ? distanceMeters / durationSeconds : 0;
  if (speedMps <= 0) return 0;
  
  // Constants
  const gravitationalAcceleration = 9.8; // m/s²
  const rollingResistanceCoefficient = 0.005; // typical for road bike on asphalt
  const airDensity = 1.226; // kg/m³
  const dragCoefficient = 0.7; // typical for cyclist
  const frontalArea = 0.5; // m² (typical for cyclist)
  const mechanicalEfficiency = 0.8; // 80% efficiency of power transfer
  const humanEfficiency = 0.24; // ~24% efficiency of converting food energy to mechanical work
  
  // Calculate energy required to overcome gravity (climbing)
  const gravitationalEnergy = riderWeight * gravitationalAcceleration * elevation;
  
  // Calculate energy required to overcome rolling resistance
  const rollingEnergy = rollingResistanceCoefficient * riderWeight * gravitationalAcceleration * distanceMeters;
  
  // Calculate energy required to overcome air resistance
  const headwindComponent = windSpeed * Math.cos((windDirection - 0) * Math.PI / 180);
  const effectiveSpeed = speedMps + headwindComponent;
  const airResistanceEnergy = 0.5 * airDensity * dragCoefficient * frontalArea * Math.pow(effectiveSpeed, 2) * distanceMeters / speedMps;
  
  // Total mechanical energy
  const totalMechanicalEnergy = (gravitationalEnergy + rollingEnergy + airResistanceEnergy) / mechanicalEfficiency;
  
  // Convert to calories (1 joule = 0.000239 calories)
  const caloriesFromWork = totalMechanicalEnergy * 0.000239 / humanEfficiency;
  
  // Add base metabolic rate calories
  const bmrPerSecond = (riderWeight * 24 * 3600) / 86400; // Simple estimate
  const bmrCalories = bmrPerSecond * durationSeconds * 0.000239;
  
  return Math.round(caloriesFromWork + bmrCalories);
}
