
import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

interface RouteMapProps {
  center?: [number, number];  // [latitude, longitude]
  zoom?: number;
  height?: string;
  className?: string;
  gpxData?: string | null; // For future GPX route rendering
}

const RouteMap = ({ 
  center = [51.505, -0.09], 
  zoom = 13, 
  height = '320px',
  className = '',
  gpxData = null
}: RouteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Fix for default marker icons in Leaflet
    const DefaultIcon = L.icon({
      iconUrl: icon,
      shadowUrl: iconShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41]
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

      // Add a sample marker at the center position
      L.marker(center).addTo(map)
        .bindPopup('Route location')
        .openPopup();

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
  }, [center, zoom, gpxData]);

  return (
    <div className={`route-map ${className}`} style={{ height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
};

export default RouteMap;
