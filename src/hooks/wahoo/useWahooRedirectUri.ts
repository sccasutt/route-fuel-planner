
export function useWahooRedirectUri() {
  // Use the hardcoded domain that matches exactly what's registered with Wahoo
  // This should match the exact URL registered in the Wahoo developer console
  return "https://pedalplate.food/wahoo-callback";
}
