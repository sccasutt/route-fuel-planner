
import React, { useEffect, useRef, useState } from 'react';
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
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map when component mounts
  useEffect(() => {
    // Check if element is available and map isn't already initialized
    if (!mapRef.current || mapInstanceRef.current) return;

    // Wait a bit to ensure the container is fully rendered and sized
    const initTimer = setTimeout(() => {
      try {
        if (!mapRef.current) return;

        // Check if container has size
        if (mapRef.current.clientHeight === 0 || mapRef.current.clientWidth === 0) {
          console.log("Map container has zero size, delaying initialization");
          return;
        }

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
          try {
            map.fitBounds(routePath.getBounds());
          } catch (e) {
            console.warn("Could not fit map to bounds:", e);
          }
        }

        // If we have GPX data (for future implementation)
        if (gpxData) {
          // Here you would parse and render the GPX data on the map
          console.log("GPX data available for rendering");
        }

        // Signal that map is ready
        setIsMapReady(true);

        // Force a map size update after a delay to handle cases where
        // container dimensions change after initialization
        setTimeout(() => {
          if (map && map.getContainer()) {  // Use proper method to check container existence
            map.invalidateSize();
          }
        }, 250);

      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }, 100); // Short delay to ensure container is ready

    // Cleanup on unmount
    return () => {
      clearTimeout(initTimer);
      
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (e) {
          console.error("Error cleaning up map:", e);
        }
      }
    };
  }, [center, zoom, mapStyle]); // Don't include routeCoordinates in dependencies here

  // Handle route drawing separately
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    // Clear any existing routes
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline && !(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // If we have route coordinates, draw the route path
    if (routeCoordinates && routeCoordinates.length > 1) {
      try {
        const routePath = drawRoutePath(map, routeCoordinates, routeStyle);
        
        // Fit the map to the route bounds
        try {
          map.fitBounds(routePath.getBounds());
        } catch (e) {
          console.warn("Could not fit map to bounds:", e);
        }
      } catch (error) {
        console.error("Error drawing route:", error);
      }
    }
  }, [routeCoordinates, routeStyle, isMapReady]);

  // Apply custom CSS styles for the map container
  const mapStyles = {
    height,
    position: 'relative' as const,
    borderRadius: className.includes('rounded') ? 'inherit' : '0',
  };

  return (
    <div className={`route-map ${className}`} style={mapStyles}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
      {isMapReady && mapInstanceRef.current && (
        <RouteMarkers 
          map={mapInstanceRef.current}
          routeCoordinates={routeCoordinates}
          startPoint={startPoint}
          endPoint={endPoint}
          center={center}
        />
      )}
    </div>
  );
}

export default RouteMap;
