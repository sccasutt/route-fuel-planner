
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
  const markerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Safety check - if map isn't initialized yet, don't proceed
    if (!map) {
      console.log("Map not available yet, skipping marker initialization");
      return;
    }
    
    // Enhanced check for map container readiness
    const container = map.getContainer();
    if (!container) {
      console.log("Map container not available yet");
      return;
    }

    // Make sure the map's container is properly rendered in the DOM with size
    if (!document.body.contains(container) || 
        container.clientHeight === 0 || 
        container.clientWidth === 0) {
      console.log("Map container not properly rendered in DOM yet or has zero size");
      return;
    }

    // Perform marker cleanup first before adding new markers
    if (markersRef.current.length > 0) {
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
    }
    
    // Add markers with a longer delay to ensure map is ready
    markerTimerRef.current = setTimeout(() => {
      try {
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

        // Double check map container is still valid before adding markers
        if (!map.getContainer() || !document.body.contains(map.getContainer())) {
          console.log("Map container no longer valid, aborting marker creation");
          return;
        }

        // Add start and end markers if provided
        if (startPoint) {
          try {
            const marker = L.marker(startPoint, { icon: StartIcon }).addTo(map);
            marker.bindPopup('Start');
            markersRef.current.push(marker);
          } catch (e) {
            console.error("Error adding start marker:", e);
          }
        }
        
        if (endPoint) {
          try {
            const marker = L.marker(endPoint, { icon: EndIcon }).addTo(map);
            marker.bindPopup('Finish');
            markersRef.current.push(marker);
          } catch (e) {
            console.error("Error adding end marker:", e);
          }
        }

        // If we have route coordinates but no explicit start/end points
        if (routeCoordinates && routeCoordinates.length > 1 && !startPoint && !endPoint) {
          const firstPoint = routeCoordinates[0];
          const lastPoint = routeCoordinates[routeCoordinates.length - 1];
          
          // Add start marker
          try {
            const startMarker = L.marker(firstPoint, { icon: StartIcon }).addTo(map);
            startMarker.bindPopup('Start');
            markersRef.current.push(startMarker);
          } catch (e) {
            console.error("Error adding first route marker:", e);
          }
          
          // Add end marker
          try {
            const endMarker = L.marker(lastPoint, { icon: EndIcon }).addTo(map);
            endMarker.bindPopup('Finish');
            markersRef.current.push(endMarker);
          } catch (e) {
            console.error("Error adding last route marker:", e);
          }
        }

        // If no route coordinates and no start/end points, add a marker at center
        if ((!routeCoordinates || routeCoordinates.length === 0) && 
            (!startPoint && !endPoint)) {
          try {
            const marker = L.marker(center).addTo(map);
            marker.bindPopup('Route location').openPopup();
            markersRef.current.push(marker);
          } catch (e) {
            console.error("Error adding center marker:", e);
          }
        }
      } catch (error) {
        console.error("Error initializing map markers:", error);
      }
    }, 600); // Increased delay to 600ms
    
    // Cleanup function
    return () => {
      if (markerTimerRef.current) {
        clearTimeout(markerTimerRef.current);
        markerTimerRef.current = null;
      }
      
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
