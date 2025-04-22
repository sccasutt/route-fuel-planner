
export function useWahooRedirectUri() {
  // In real deployment, ensure this matches your Wahoo config exactly
  return window.location.origin + "/wahoo-callback";
}
