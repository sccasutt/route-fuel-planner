
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteMapProps } from './types';
import { getTileLayer, drawRoutePath } from './mapUtils';
import { RouteMarkers } from './RouteMarkers';

const RouteMap = ({ 
  center = [51.505, -0.09],
  zoom = 13,
  height = '320px',
  className = '',
  routeCoordinates = [],
  startPoint,
  endPoint,
  routeStyle = {},
  mapStyle = 'default'
}: RouteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true
    });

    // Add tile layer
    const tileLayer = getTileLayer(mapStyle);
    tileLayer.addTo(map);

    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, mapStyle]);

  // Update route when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !routeCoordinates || routeCoordinates.length < 2) {
      return;
    }

    // Remove existing route layer
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    // Draw new route
    const routePath = drawRoutePath(mapInstanceRef.current, routeCoordinates, routeStyle);
    routeLayerRef.current = routePath;

    // Fit map to route bounds
    const bounds = L.latLngBounds(routeCoordinates);
    mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
  }, [routeCoordinates, routeStyle]);

  const mapStyles = {
    height,
    width: '100%',
    position: 'relative' as const,
    borderRadius: className.includes('rounded') ? 'inherit' : '0',
  };

  return (
    <div className={`route-map ${className}`} style={mapStyles}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
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
