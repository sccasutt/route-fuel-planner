
// Map component type definitions

export interface RouteMapProps {
  center?: [number, number];  // [latitude, longitude]
  zoom?: number;
  height?: string;
  className?: string;
  gpxData?: string | null; // For future GPX route rendering
  showControls?: boolean;
  routeCoordinates?: [number, number][]; // Array of lat/long points for the route
  startPoint?: [number, number]; // Optional start point
  endPoint?: [number, number]; // Optional end point
  routeStyle?: {
    color?: string;
    weight?: number;
    opacity?: number;
    dashArray?: string;
  };
  mapStyle?: 'default' | 'terrain' | 'satellite' | 'dark';
}

export interface MapIconOptions {
  iconUrl: string;
  shadowUrl: string;
  iconSize: [number, number];
  iconAnchor: [number, number];
  className?: string;
}
