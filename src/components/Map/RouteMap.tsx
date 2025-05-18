
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteMapProps } from './types';
import { RouteMarkers } from './RouteMarkers';
import { drawRoutePath, getTileLayer } from './mapUtils';

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
    if (mapRef.current && !mapInstanceRef.current) {
      // Initialize map
      const map = L.map(mapRef.current, {
        zoomControl: false // We'll add custom controls if requested
      }).setView(center, zoom);
      mapInstanceRef.current = map;

      // Get and add tile layer based on mapStyle
      const tileLayer = getTileLayer(mapStyle);
      tileLayer.addTo(map);

      // Add navigation controls if requested
      if (showControls) {
        L.control.zoom({ position: 'topright' }).addTo(map);
      }

      // If we have route coordinates, draw the route path
      if (routeCoordinates && routeCoordinates.length > 1) {
        const routePath = drawRoutePath(map, routeCoordinates, routeStyle);
        
        // Fit the map to the route bounds
        map.fitBounds(routePath.getBounds());
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
  }, [center, zoom, gpxData, showControls, routeCoordinates, mapStyle, routeStyle]);

  // Apply custom CSS styles for the map container
  const mapStyles = {
    height,
    position: 'relative' as const,
    borderRadius: className.includes('rounded') ? 'inherit' : '0',
  };

  return (
    <div className={`route-map ${className}`} style={mapStyles}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
      <RouteMarkers 
        map={mapInstanceRef.current}
        routeCoordinates={routeCoordinates}
        startPoint={startPoint}
        endPoint={endPoint}
        center={center}
      />
    </div>
  );
};

export default RouteMap;
