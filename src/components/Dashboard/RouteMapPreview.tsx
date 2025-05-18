
import React, { useState, useEffect } from "react";
import RouteMap from "../Map/RouteMap";

interface RouteMapPreviewProps {
  routeCoordinates?: [number, number][];
  hasValidCoordinates: boolean;
  height?: string;
  routeType?: string;
}

export function RouteMapPreview({ 
  routeCoordinates = [], 
  hasValidCoordinates, 
  height = "100px",
  routeType = "activity"
}: RouteMapPreviewProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Only render map when component is visible
  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);
  
  // Set route style based on route type
  const getRouteStyle = () => {
    switch(routeType?.toLowerCase()) {
      case 'workout': 
        return { color: "#F59E0B", weight: 3, opacity: 0.8 }; // Amber
      case 'ride':
        return { color: "#3B82F6", weight: 3, opacity: 0.8 }; // Blue
      case 'route':
        return { color: "#10B981", weight: 3, opacity: 0.8 }; // Green
      case 'race':
        return { color: "#EF4444", weight: 3, opacity: 0.8 }; // Red
      default:
        return { color: "#8B5CF6", weight: 3, opacity: 0.8 }; // Purple (default)
    }
  };

  if (!hasValidCoordinates) {
    return (
      <div className="h-[100px] w-full mb-2 flex items-center justify-center bg-muted rounded-md border border-border/50">
        <p className="text-sm text-muted-foreground">No route data available</p>
      </div>
    );
  }

  return (
    <div className="h-[100px] w-full mb-2">
      {isVisible && (
        <RouteMap
          center={routeCoordinates[0] || [51.505, -0.09]}
          zoom={11}
          height="100%"
          className="rounded-md border border-border/50"
          showControls={false}
          routeCoordinates={routeCoordinates}
          mapStyle="default"
          routeStyle={getRouteStyle()}
        />
      )}
    </div>
  );
}
