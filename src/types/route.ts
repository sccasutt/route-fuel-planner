
export interface RouteType {
  id: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  duration_seconds?: number | null;
  calories: number;
  gpx_data?: string | null;
  type?: string;
  gpx_file_url?: string | null;
  coordinates?: any; // Allow any type from DB, we'll parse it correctly in useRouteData
  user_id?: string;
  wahoo_route_id?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
  // Additional fields that might come from Wahoo API
  start_lat?: number | null;
  start_lng?: number | null;
  description?: string | null;
  file_url?: string | null;
  file?: {
    url: string;
  } | null;
}
