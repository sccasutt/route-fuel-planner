import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { createMapIcon, DEFAULT_ICON_URL, DEFAULT_SHADOW_URL } from './mapUtils';

interface RouteMarkersProps {
  map: L.Map | null;
  routeCoordinates?: [number, number][];
  startPoint?: [number, number];
  endPoint?: [number, number];
  center: [number, number];
}

export function RouteMarkers({
  map,
  routeCoordinates,
  startPoint,
  endPoint,
  center
}: RouteMarkersProps) {
  // Keep track of created markers for cleanup
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    // Safety check - if map isn't initialized yet, don't proceed
    if (!map) return;
    
    // Make sure the map is properly loaded and has a container
    try {
      const container = map.getContainer();
      if (!container || container.clientHeight === 0 || container.clientWidth === 0) {
        console.log("Map container not ready yet, skipping marker initialization");
        return;
      }
      
      // Clean up previous markers first
      markersRef.current.forEach(marker => {
        if (marker) {
          marker.remove();
        }
      });
      markersRef.current = [];
      
      // Create marker icons
      const DefaultIcon = createMapIcon({
        iconUrl: DEFAULT_ICON_URL,
        shadowUrl: DEFAULT_SHADOW_URL,
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });
      
      // Set default icon for all markers
      L.Marker.prototype.options.icon = DefaultIcon;
      
      const StartIcon = createMapIcon({
        iconUrl: DEFAULT_ICON_URL,
        shadowUrl: DEFAULT_SHADOW_URL,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        className: 'start-icon'
      });
      
      const EndIcon = createMapIcon({
        iconUrl: DEFAULT_ICON_URL,
        shadowUrl: DEFAULT_SHADOW_URL,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        className: 'end-icon'
      });

      // Add start and end markers if provided
      if (startPoint) {
        const marker = L.marker(startPoint, { icon: StartIcon }).addTo(map);
        marker.bindPopup('Start');
        markersRef.current.push(marker);
      }
      
      if (endPoint) {
        const marker = L.marker(endPoint, { icon: EndIcon }).addTo(map);
        marker.bindPopup('Finish');
        markersRef.current.push(marker);
      }

      // If we have route coordinates but no explicit start/end points
      if (routeCoordinates && routeCoordinates.length > 1 && !startPoint && !endPoint) {
        const firstPoint = routeCoordinates[0];
        const lastPoint = routeCoordinates[routeCoordinates.length - 1];
        
        // Add start marker
        const startMarker = L.marker(firstPoint, { icon: StartIcon }).addTo(map);
        startMarker.bindPopup('Start');
        markersRef.current.push(startMarker);
        
        // Add end marker
        const endMarker = L.marker(lastPoint, { icon: EndIcon }).addTo(map);
        endMarker.bindPopup('Finish');
        markersRef.current.push(endMarker);
      }

      // If no route coordinates and no start/end points, add a marker at center
      if ((!routeCoordinates || routeCoordinates.length === 0) && 
          (!startPoint && !endPoint)) {
        const marker = L.marker(center).addTo(map);
        marker.bindPopup('Route location').openPopup();
        markersRef.current.push(marker);
      }
    } catch (error) {
      console.error("Error initializing map markers:", error);
    }

    // Cleanup function
    return () => {
      markersRef.current.forEach(marker => {
        if (marker) {
          try {
            marker.remove();
          } catch (e) {
            console.error("Error removing marker:", e);
          }
        }
      });
      markersRef.current = [];
    };
  }, [map, routeCoordinates, startPoint, endPoint, center]);

  return null;
}
