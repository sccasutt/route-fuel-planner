
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
