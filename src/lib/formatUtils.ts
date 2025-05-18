
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

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Truncate text to a specific length
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}
