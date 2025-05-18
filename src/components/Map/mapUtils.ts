
import L from 'leaflet';

// Define default icon URLs - leaflet has issues with bundlers finding the marker icons
export const DEFAULT_ICON_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
export const DEFAULT_SHADOW_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

/**
 * Creates a Leaflet icon with the specified options
 */
export function createMapIcon(options: { 
  iconUrl: string; 
  shadowUrl: string; 
  iconSize: [number, number]; 
  iconAnchor: [number, number];
  className?: string;
}): L.Icon {
  return L.icon({
    iconUrl: options.iconUrl,
    shadowUrl: options.shadowUrl,
    iconSize: options.iconSize,
    iconAnchor: options.iconAnchor,
    className: options.className
  });
}

/**
 * Returns the appropriate tile layer based on the map style
 */
export function getTileLayer(mapStyle: 'default' | 'terrain' | 'satellite' | 'dark'): L.TileLayer {
  switch (mapStyle) {
    case 'terrain':
      return L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        maxZoom: 17
      });
    case 'satellite':
      return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
      });
    case 'dark':
      return L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      });
    default:
      return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      });
  }
}

/**
 * Draws a route path on the map
 */
export function drawRoutePath(
  map: L.Map, 
  routeCoordinates: [number, number][], 
  routeStyle: {
    color?: string;
    weight?: number;
    opacity?: number;
    dashArray?: string;
  }
): L.Polyline {
  // Apply styling
  const gradientStyle: L.PolylineOptions = {
    color: routeStyle.color || '#8B5CF6',
    weight: routeStyle.weight || 4,
    opacity: routeStyle.opacity || 0.9,
    lineJoin: 'round' as L.LineJoinShape,
    dashArray: routeStyle.dashArray || ''
  };

  // Draw main route polyline
  const routePath = L.polyline(routeCoordinates, gradientStyle).addTo(map);
  
  // Add subtle glow effect by adding a wider, more transparent line underneath
  if (!routeStyle.dashArray) { // Don't add glow for dashed lines
    L.polyline(routeCoordinates, {
      color: routeStyle.color || '#8B5CF6',
      weight: (routeStyle.weight || 4) + 4,
      opacity: 0.3,
      lineJoin: 'round' as L.LineJoinShape
    }).addTo(map);
  }
  
  return routePath;
}
