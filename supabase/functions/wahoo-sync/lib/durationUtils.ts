
/**
 * Utilities for handling and formatting duration values
 */

/**
 * Format duration string to consistent HH:MM:SS format
 */
export const formatDurationString = (duration: string): string => {
  if (!duration) return "0:00:00";
  
  // If already in HH:MM:SS format, return as is
  if (/^\d+:\d{2}:\d{2}$/.test(duration)) return duration;
  
  // Try to parse various formats
  let seconds = durationToSeconds(duration);
  
  // Format as HH:MM:SS
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Convert duration string or value to seconds
 */
export const durationToSeconds = (duration: string | number): number => {
  if (typeof duration === 'number') return duration;
  if (!duration) return 0;
  
  // Check if in HH:MM:SS format
  const hhmmss = duration.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);
  if (hhmmss) {
    return parseInt(hhmmss[1]) * 3600 + parseInt(hhmmss[2]) * 60 + parseInt(hhmmss[3]);
  }
  
  // Check if in MM:SS format
  const mmss = duration.match(/^(\d+):(\d{1,2})$/);
  if (mmss) {
    return parseInt(mmss[1]) * 60 + parseInt(mmss[2]);
  }
  
  // Check if it has "hr", "min", "sec" notation
  let seconds = 0;
  const hourMatch = duration.match(/(\d+)\s*h(r|our|rs|ours)?/i);
  const minMatch = duration.match(/(\d+)\s*m(in|inute|ins|inutes)?/i);
  const secMatch = duration.match(/(\d+)\s*s(ec|econd|ecs|econds)?/i);
  
  if (hourMatch) seconds += parseInt(hourMatch[1]) * 3600;
  if (minMatch) seconds += parseInt(minMatch[1]) * 60;
  if (secMatch) seconds += parseInt(secMatch[1]);
  
  // If nothing matched but it's just a number, assume it's seconds
  if (seconds === 0 && /^\d+(\.\d+)?$/.test(duration)) {
    seconds = parseFloat(duration);
  }
  
  return seconds;
};
