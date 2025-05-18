
/**
 * Formats a duration in seconds to a human-readable string
 * @param seconds Total duration in seconds
 * @returns Formatted string like "2h 30m 13s" or "155h 33m 45s"
 */
export function formatHumanReadableDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m"; // Default to 0 minutes if invalid
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = "";
  
  if (hours > 0) {
    result += `${hours}h `;
  }
  
  if (minutes > 0 || hours > 0) {
    result += `${minutes}m `;
  }
  
  if (secs > 0) {
    result += `${secs}s`;
  }
  
  return result.trim();
}

/**
 * Formats a HH:MM:SS duration string to a human-readable string
 * @param timeString Duration in HH:MM:SS format
 * @returns Formatted string like "2h 30m 13s" or "155h 33m 45s"
 */
export function formatTimeStringToHumanReadable(timeString: string): string {
  if (!timeString) return "0m";
  
  const parts = timeString.split(':');
  if (parts.length !== 3) return "0m";
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  
  let result = "";
  
  if (hours > 0) {
    result += `${hours}h `;
  }
  
  if (minutes > 0 || hours > 0) {
    result += `${minutes}m `;
  }
  
  if (seconds > 0) {
    result += `${seconds}s`;
  }
  
  return result.trim();
}
