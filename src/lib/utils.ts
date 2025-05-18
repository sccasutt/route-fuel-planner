
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatCurrency, debounce } from "./generalUtils";
import { calculateBMI, getBMICategory, calculateCalories } from "./calculationUtils";
import { formatDuration, formatShortDate, formatDistance, formatElevation, getInitials, truncateText } from "./formatUtils";
import { ensureValidDuration, secondsToTimeString, calculatePace } from "./timeUtils";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export all utility functions
export {
  formatCurrency,
  calculateBMI,
  getBMICategory,
  calculateCalories,
  formatDuration,
  formatShortDate,
  ensureValidDuration,
  secondsToTimeString,
  formatDistance,
  formatElevation,
  getInitials,
  truncateText,
  calculatePace,
  debounce
};
