import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

export function calculateBMI(weight: number, height: number): number {
  // Weight in kg, height in cm
  if (weight <= 0 || height <= 0) return 0;
  return weight / Math.pow(height / 100, 2);
}

export function getBMICategory(bmi: number): string {
  if (bmi <= 0) return 'Unknown';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

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
 * Format duration for display
 */
export function formatDuration(duration: string): string {
  if (!duration) return "0:00";

  // If it's already in HH:MM:SS format, convert to MM:SS or H:MM
  const parts = duration.split(":");
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  // If it's already in MM:SS format, return as is
  if (parts.length === 2) {
    return duration;
  }

  return duration;
}

/**
 * Format date to a short readable format
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return "";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Ensure duration is never zero or invalid
 */
export function ensureValidDuration(duration: string): string {
  if (!duration) return "0:01:00"; // Default to 1 minute
  
  if (duration === "0" || duration === "0s" || duration === "0:00:00") {
    return "0:01:00"; // Default to 1 minute
  }
  
  // Handle HH:MM:SS format
  const parts = duration.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    
    if (hours === 0 && minutes === 0 && seconds === 0) {
      return "0:01:00"; // Default to 1 minute
    }
    
    // Keep valid duration
    return duration;
  }
  
  return duration;
}

/**
 * Convert seconds to HH:MM:SS format
 */
export function secondsToTimeString(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:01:00"; // Default to 1 minute if no valid value
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format distance values to a user-friendly format
 * @param distance Distance in meters
 */
export function formatDistance(distance: number): string {
  // Convert to kilometers and format to 1 decimal place
  return (distance / 1000).toFixed(1);
}

/**
 * Format elevation values to a user-friendly format
 * @param elevation Elevation in meters
 */
export function formatElevation(elevation: number): string {
  // Round to nearest whole number
  return Math.round(elevation).toString();
}

export function getInitials(name: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

export function calculatePace(distanceKm: number, durationSeconds: number): string {
  if (!distanceKm || distanceKm <= 0 || !durationSeconds || durationSeconds <= 0) {
    return '--:--';
  }
  
  // Calculate pace in seconds per kilometer
  const paceSeconds = durationSeconds / distanceKm;
  
  // Convert to minutes and seconds
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.floor(paceSeconds % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
