
// Types for Wahoo integration

export interface WahooTokenData {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  wahoo_user_id?: string | null;
  email?: string;
}

export interface WahooActivityData {
  id: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  duration_seconds?: number;
  calories: number;
  gpx_data?: string | null;
}

export interface WahooSyncResult {
  success: boolean;
  error?: Error;
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
