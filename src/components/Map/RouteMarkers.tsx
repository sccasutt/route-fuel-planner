
import { useEffect } from 'react';
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
  useEffect(() => {
    if (!map) return;
    
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
      L.marker(startPoint, { icon: StartIcon }).addTo(map)
        .bindPopup('Start');
    }
    
    if (endPoint) {
      L.marker(endPoint, { icon: EndIcon }).addTo(map)
        .bindPopup('Finish');
    }

    // If we have route coordinates but no explicit start/end points
    if (routeCoordinates && routeCoordinates.length > 1 && !startPoint && !endPoint) {
      const firstPoint = routeCoordinates[0];
      const lastPoint = routeCoordinates[routeCoordinates.length - 1];
      
      // Add start marker
      L.marker(firstPoint, { icon: StartIcon }).addTo(map)
        .bindPopup('Start');
        
      // Add end marker
      L.marker(lastPoint, { icon: EndIcon }).addTo(map)
        .bindPopup('Finish');
    }

    // If no route coordinates and no start/end points, add a marker at center
    if ((!routeCoordinates || routeCoordinates.length === 0) && 
        (!startPoint && !endPoint)) {
      L.marker(center).addTo(map)
        .bindPopup('Route location')
        .openPopup();
    }

    // Cleanup function
    return () => {
      // No specific cleanup needed for markers as they'll be removed with the map
    };
  }, [map, routeCoordinates, startPoint, endPoint, center]);

  return null;
}
