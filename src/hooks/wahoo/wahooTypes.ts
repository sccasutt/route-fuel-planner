
// Types for the Wahoo integration

// Global state for tracking Wahoo data loading
export const wahooGlobalState = {
  isInitialized: false,
  lastFetchTimestamp: 0
};

// Wahoo profile data
export interface WahooProfileData {
  id: string;
  wahooUserId: string | null;
  weightKg: number | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Weather data type
export interface WeatherData {
  id: string;
  routeId: string;
  temperature: number | null;
  windSpeed: number | null;
  humidity: number | null;
  conditions: string | null;
  createdAt: string;
  updatedAt: string;
}

// Main activity data type
export interface WahooActivityData {
  id: string;
  wahooRouteId?: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  duration_seconds: number;
  calories: number;
  coordinates: [number, number][];  // Format: [latitude, longitude][]
  gpx_data: string | null;  // Stored JSON string with coordinates and possibly raw GPX
  raw_gpx?: any;            // Raw GPX data if available (parsed from gpx_data)
  gpx_file_url: string | null;
  type: string;
  weather?: WeatherData | null;
  metadata?: any;
}
