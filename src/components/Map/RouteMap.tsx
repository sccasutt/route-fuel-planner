
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
  const initTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sizeCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize map when component mounts
  useEffect(() => {
    // Check if element is available and map isn't already initialized
    if (!mapRef.current) return;
    
    // Clear any existing map instance first
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      } catch (e) {
        console.error("Error cleaning up previous map:", e);
      }
    }

    // Wait longer to ensure the container is fully rendered and sized
    initTimerRef.current = setTimeout(() => {
      try {
        if (!mapRef.current) {
          console.log("Map container ref is null, skipping initialization");
          return;
        }

        // Check for container size with a retry mechanism
        let attempts = 0;
        const maxAttempts = 5;
        
        const checkSize = () => {
          attempts++;
          
          // Check if container has size and is in the DOM
          if (!document.body.contains(mapRef.current) || 
              !mapRef.current.clientHeight || 
              !mapRef.current.clientWidth) {
            if (attempts < maxAttempts) {
              console.log(`Map container not ready, attempt ${attempts}/${maxAttempts}`);
              return false;
            } else {
              console.log("Max attempts reached, trying to initialize map anyway");
              return true; // Try anyway after max attempts
            }
          }
          return true; // Container is ready
        };
        
        if (!checkSize()) {
          sizeCheckIntervalRef.current = setInterval(() => {
            if (checkSize()) {
              if (sizeCheckIntervalRef.current) {
                clearInterval(sizeCheckIntervalRef.current);
                sizeCheckIntervalRef.current = null;
              }
              initializeMap();
            } else if (attempts >= 5) {
              if (sizeCheckIntervalRef.current) {
                clearInterval(sizeCheckIntervalRef.current);
                sizeCheckIntervalRef.current = null;
              }
              initializeMap(); // Try anyway after max attempts
            }
          }, 100);
        } else {
          initializeMap();
        }
      } catch (error) {
        console.error("Error in map initialization setup:", error);
      }
    }, 500);

    function initializeMap() {
      try {
        if (!mapRef.current) return;
        
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
          try {
            const routePath = drawRoutePath(map, routeCoordinates, routeStyle);
            
            // Fit the map to the route bounds
            try {
              map.fitBounds(routePath.getBounds(), {
                padding: [30, 30]
              });
            } catch (e) {
              console.warn("Could not fit map to bounds:", e);
            }
          } catch (e) {
            console.error("Error drawing route path:", e);
          }
        }

        // If we have GPX data (for future implementation)
        if (gpxData) {
          // Here you would parse and render the GPX data on the map
          console.log("GPX data available for rendering");
        }

        // Force a map size update after a delay to handle container size changes
        setTimeout(() => {
          if (map && map.getContainer() && document.body.contains(map.getContainer())) {
            map.invalidateSize(true);
            // Signal that map is ready only after we've successfully initialized
            setIsMapReady(true);
          }
        }, 300);

      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current);
        initTimerRef.current = null;
      }
      
      if (sizeCheckIntervalRef.current) {
        clearInterval(sizeCheckIntervalRef.current);
        sizeCheckIntervalRef.current = null;
      }
      
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (e) {
          console.error("Error cleaning up map:", e);
        }
      }
      
      setIsMapReady(false);
    };
  }, [center, zoom, mapStyle]); // Don't include routeCoordinates in dependencies here

  // Handle route drawing separately
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    try {
      // Clear any existing routes
      map.eachLayer((layer) => {
        if (layer instanceof L.Polyline && !(layer instanceof L.TileLayer)) {
          map.removeLayer(layer);
        }
      });

      // If we have route coordinates, draw the route path
      if (routeCoordinates && routeCoordinates.length > 1) {
        const routePath = drawRoutePath(map, routeCoordinates, routeStyle);
        
        // Fit the map to the route bounds
        try {
          map.fitBounds(routePath.getBounds(), {
            padding: [30, 30]
          });
        } catch (e) {
          console.warn("Could not fit map to bounds:", e);
        }
      }
    } catch (error) {
      console.error("Error drawing route:", error);
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
