
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format duration string (HH:MM:SS) to a more readable format
 * @param durationString Duration string in HH:MM:SS format
 * @returns Formatted duration string (e.g. "2h 30m" or "45m 10s")
 */
export function formatDuration(durationString: string): string {
  if (!durationString) return "0:00";
  
  const parts = durationString.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  // Handle MM:SS format
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    return `${minutes}m ${seconds}s`;
  }
  
  return durationString;
}

/**
 * Parse a duration string into seconds
 * @param durationString Duration string in various formats (HH:MM:SS, MM:SS, or raw seconds)
 * @returns Total seconds as a number
 */
export function parseDurationToSeconds(durationString: string): number {
  if (!durationString) return 0;
  
  // If it's already a number as string, parse it directly
  if (!isNaN(Number(durationString))) {
    return parseInt(durationString, 10);
  }
  
  const parts = durationString.split(':');
  
  if (parts.length === 3) {
    // HH:MM:SS format
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    // MM:SS format
    const minutes = parseInt(parts[0], 10) || 0;
    const seconds = parseInt(parts[1], 10) || 0;
    
    return minutes * 60 + seconds;
  }
  
  return 0;
}

/**
 * Format seconds to HH:MM:SS string
 * @param seconds Total seconds
 * @returns Formatted duration string in HH:MM:SS format
 */
export function formatSecondsToTimeString(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

