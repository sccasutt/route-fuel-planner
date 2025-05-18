
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
  endPoint
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
      const map = L.map(mapRef.current).setView(center, zoom);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Add navigation controls if requested
      if (showControls) {
        L.control.zoom({ position: 'topright' }).addTo(map);
      }

      // If we have route coordinates, draw the route path
      if (routeCoordinates && routeCoordinates.length > 1) {
        // Draw polyline for the route
        const routePath = L.polyline(routeCoordinates, {
          color: 'blue',
          weight: 4,
          opacity: 0.7,
          lineJoin: 'round'
        }).addTo(map);
        
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
  }, [center, zoom, gpxData, showControls, routeCoordinates, startPoint, endPoint]);

  return (
    <div className={`route-map ${className}`} style={{ height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
};

export default RouteMap;
