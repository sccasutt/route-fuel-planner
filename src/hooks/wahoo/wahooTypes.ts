
// Types for Wahoo integration

export interface WahooTokenData {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  wahoo_user_id?: string | null;
  email?: string;
}

export interface WahooWeatherData {
  id: string;
  route_id: string; 
  temperature?: number;
  wind_speed?: number;
  humidity?: number;
  conditions?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WahooActivityData {
  id: string;
  wahooRouteId?: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  duration_seconds?: number;
  calories: number;
  gpx_data?: string | null;
  coordinates?: [number, number][];
  gpx_file_url?: string | null;
  type?: string;
  weather?: WahooWeatherData | null;
  metadata?: any;
}

export interface WahooSyncResult {
  success: boolean;
  error?: Error;
  data?: {
    profile?: any;
    routeCount?: number;
    activityCount?: number;
  };
}

export interface WahooProfileData {
  id: string;
  wahoo_user_id?: string | null;
  last_synced_at?: string | null;
  weight_kg?: number | null;
  created_at?: string;
  updated_at?: string;
}

// Global state to avoid multiple initializations
export const wahooGlobalState = {
  isInitialized: false,
  lastFetchTimestamp: 0
};
