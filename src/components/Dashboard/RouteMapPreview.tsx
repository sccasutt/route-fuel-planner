
import React from "react";
import RouteMap from "@/components/Map/RouteMap";

interface RouteMapPreviewProps {
  routeCoordinates?: [number, number][];
  hasValidCoordinates?: boolean;
  height?: string;
  routeType?: string;
}

export function RouteMapPreview({ 
  routeCoordinates = [],
  hasValidCoordinates = false,
  height = "100px",
  routeType = "activity"
}: RouteMapPreviewProps) {
  // If we have valid coordinates, show the map
  if (hasValidCoordinates && routeCoordinates.length >= 2) {
    // Calculate center point from coordinates
    const centerLat = routeCoordinates.reduce((sum, coord) => sum + coord[0], 0) / routeCoordinates.length;
    const centerLng = routeCoordinates.reduce((sum, coord) => sum + coord[1], 0) / routeCoordinates.length;
    
    return (
      <RouteMap 
        center={[centerLat, centerLng]}
        routeCoordinates={routeCoordinates}
        height={height}
        zoom={12}
        className="rounded-t-md"
        mapStyle="default"
      />
    );
  }

  // Fallback for routes without coordinates
  return (
    <div className={`h-[${height}] w-full mb-2 flex items-center justify-center bg-muted rounded-md border border-border/50`}>
      <p className="text-sm text-muted-foreground">No route data</p>
    </div>
  );
}
