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
    
    // Keep valid duration but ensure it's in H:MM:SS format (not leading zeros for hours)
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return duration;
}

/**
 * Convert seconds to H:MM:SS format
 */
export function secondsToTimeString(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:01:00"; // Default to 1 minute if no valid value
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  // Use H:MM:SS format (no leading zero for hours)
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate pace (minutes per kilometer)
 */
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
