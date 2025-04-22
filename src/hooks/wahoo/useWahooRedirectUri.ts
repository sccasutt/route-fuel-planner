
export function useWahooRedirectUri() {
  // Use a hardcoded format that matches exactly what's registered with Wahoo
  // Remove any trailing slashes from origin to ensure consistency
  const origin = window.location.origin.replace(/\/$/, '');
  return `${origin}/wahoo-callback`;
}
