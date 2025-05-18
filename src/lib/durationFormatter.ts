
/**
 * Formats a duration in seconds to a human-readable string
 * @param seconds Total duration in seconds
 * @returns Formatted string like "2h 30m" or "45m"
 */
export function formatHumanReadableDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "1m"; // Default to 1 minute
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  } 
  
  return `${minutes > 0 ? `${minutes}m` : '1m'}`;
}

/**
 * Formats a HH:MM:SS duration string to a human-readable string
 * @param timeString Duration in HH:MM:SS format
 * @returns Formatted string like "2h 30m" or "45m"
 */
export function formatTimeStringToHumanReadable(timeString: string): string {
  if (!timeString) return "1m";
  
  const parts = timeString.split(':');
  if (parts.length !== 3) return "1m";
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  }
  
  return `${minutes > 0 ? `${minutes}m` : '1m'}`;
}
