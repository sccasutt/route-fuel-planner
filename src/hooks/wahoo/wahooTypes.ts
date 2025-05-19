// Types for the Wahoo integration

// Global state for tracking Wahoo data loading
export const wahooGlobalState = {
  isInitialized: false,
  lastFetchTimestamp: 0
};

// Interface for Wahoo activity data with all necessary fields
export interface WahooActivityData {
  id: string;
  wahoo_route_id?: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  duration_seconds: number;
  calories: number;
  type?: string;
  coordinates?: [number, number][];
  gpx_file_url?: string | null;
  file_url?: string | null;
  weatherData?: {
    temperature?: number;
    conditions?: string;
    windSpeed?: number;
    humidity?: number;
  } | null;
  metadata?: any;
  start_lat?: number | null;
  start_lng?: number | null;
}

// Interface for Wahoo token data
export interface WahooTokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  wahoo_user_id?: string;
  email?: string;
}

// Interface for Wahoo profile data
export interface WahooProfileData {
  id: string;
  wahoo_user_id?: string;
  weight_kg?: number;
  last_synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface for Wahoo authentication state
export interface WahooAuthState {
  isAuthenticated: boolean;
  hasToken: boolean;
  wahooUserId?: string | null;
  email?: string | null;
  expiresAt?: number | null;
  lastChecked: number;
}
