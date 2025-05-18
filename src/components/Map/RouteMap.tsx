
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Define default icon URLs - leaflet has issues with bundlers finding the marker icons
const DEFAULT_ICON_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const DEFAULT_SHADOW_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

interface RouteMapProps {
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

const RouteMap = ({ 
  center = [51.505, -0.09], 
  zoom = 13, 
  height = '320px',
  className = '',
  gpxData = null,
  showControls = false,
  routeCoordinates = [],
  startPoint,
  endPoint,
  routeStyle = {
    color: '#8B5CF6', // Vivid purple
    weight: 4,
    opacity: 0.9
  },
  mapStyle = 'default'
}: RouteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Fix for default marker icons in Leaflet when using bundlers
    const DefaultIcon = L.icon({
      iconUrl: DEFAULT_ICON_URL,
      shadowUrl: DEFAULT_SHADOW_URL,
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
    
    // Create start and end icons
    const StartIcon = L.icon({
      iconUrl: DEFAULT_ICON_URL,
      shadowUrl: DEFAULT_SHADOW_URL,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      className: 'start-icon' // We could style this differently with CSS
    });
    
    const EndIcon = L.icon({
      iconUrl: DEFAULT_ICON_URL,
      shadowUrl: DEFAULT_SHADOW_URL,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      className: 'end-icon' // We could style this differently with CSS
    });
    
    L.Marker.prototype.options.icon = DefaultIcon;

    if (mapRef.current && !mapInstanceRef.current) {
      // Initialize map
      const map = L.map(mapRef.current, {
        zoomControl: false // We'll add custom controls if requested
      }).setView(center, zoom);
      mapInstanceRef.current = map;

      // Select tile layer based on mapStyle
      let tileLayer;
      switch (mapStyle) {
        case 'terrain':
          tileLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
            maxZoom: 17
          });
          break;
        case 'satellite':
          tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19
          });
          break;
        case 'dark':
          tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
          });
          break;
        default:
          tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          });
      }
      
      // Add selected tile layer
      tileLayer.addTo(map);

      // Add navigation controls if requested
      if (showControls) {
        L.control.zoom({ position: 'topright' }).addTo(map);
      }

      // If we have route coordinates, draw the route path with enhanced styling
      if (routeCoordinates && routeCoordinates.length > 1) {
        // Apply gradient effect if possible - visible with transparent color
        const gradientStyle = {
          color: routeStyle.color || '#8B5CF6',
          weight: routeStyle.weight || 4,
          opacity: routeStyle.opacity || 0.9,
          lineJoin: 'round',
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
            lineJoin: 'round'
          }).addTo(map);
        }
        
        // Fit the map to the route bounds
        map.fitBounds(routePath.getBounds());
        
        // Add start and end markers if not explicitly provided
        if (!startPoint && !endPoint) {
          const firstPoint = routeCoordinates[0];
          const lastPoint = routeCoordinates[routeCoordinates.length - 1];
          
          // Add start marker
          L.marker(firstPoint, { icon: StartIcon }).addTo(map)
            .bindPopup('Start');
            
          // Add end marker
          L.marker(lastPoint, { icon: EndIcon }).addTo(map)
            .bindPopup('Finish');
        }
      }
      
      // Add explicit start and end points if provided
      if (startPoint) {
        L.marker(startPoint, { icon: StartIcon }).addTo(map)
          .bindPopup('Start');
      }
      
      if (endPoint) {
        L.marker(endPoint, { icon: EndIcon }).addTo(map)
          .bindPopup('Finish');
      }

      // If no route coordinates but we have a center point, add a marker there
      if ((!routeCoordinates || routeCoordinates.length === 0) && 
          (!startPoint && !endPoint)) {
        L.marker(center).addTo(map)
          .bindPopup('Route location')
          .openPopup();
      }

      // If we have GPX data (for future implementation)
      if (gpxData) {
        // Here you would parse and render the GPX data on the map
        console.log("GPX data available for rendering");
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, gpxData, showControls, routeCoordinates, startPoint, endPoint, mapStyle, routeStyle]);

  // Apply custom CSS styles for the map container
  const mapStyles = {
    height,
    position: 'relative' as const,
    borderRadius: className.includes('rounded') ? 'inherit' : '0',
  };

  return (
    <div className={`route-map ${className}`} style={mapStyles}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
};

export default RouteMap;
