
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert Date object or ISO string to seconds
 * @param dateTime Date object or ISO string
 * @returns Total seconds as a number
 */
export function getTimeInSeconds(dateTime: Date | string | number): number {
  if (typeof dateTime === 'number') return dateTime;
  
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('Invalid date provided to getTimeInSeconds:', dateTime);
    return 0;
  }
  
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

/**
 * Format a duration in seconds to a human-readable string
 * @param seconds Total duration in seconds
 * @returns Formatted duration string (e.g. "2h 30m" or "45m 10s")
 */
export function formatDuration(seconds: number | string): string {
  // Convert string to number if needed
  const totalSeconds = typeof seconds === 'string' 
    ? parseDurationToSeconds(seconds)
    : seconds;
  
  if (isNaN(totalSeconds) || totalSeconds < 0) return "0m";
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
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

/**
 * Format a Date object or timestamp to a human-readable date string
 * @param date Date object or timestamp
 * @returns Formatted date string (e.g. "May 18, 2023")
 */
export function formatDate(date: Date | string): string {
  if (!date) return "";
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatDate:', date);
    return "";
  }
  
  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a Date object or timestamp to a short date string
 * @param date Date object or timestamp
 * @returns Formatted date string (e.g. "05/18/2023")
 */
export function formatShortDate(date: Date | string): string {
  if (!date) return "";
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatShortDate:', date);
    return "";
  }
  
  return dateObj.toLocaleDateString();
}
