
export interface WahooActivityData {
  id: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  calories: number;
}

// Global state to prevent redundant API calls across hook instances
export const wahooGlobalState = {
  lastFetchTimestamp: 0,
  isInitialized: false
};
