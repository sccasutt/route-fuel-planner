
import React from "react";
import RouteMap from "../Map/RouteMap";

interface RouteMapPreviewProps {
  routeCoordinates?: [number, number][];
  hasValidCoordinates: boolean;
  height?: string;
}

export function RouteMapPreview({ 
  routeCoordinates = [], 
  hasValidCoordinates, 
  height = "100px" 
}: RouteMapPreviewProps) {
  if (!hasValidCoordinates) {
    return (
      <div className="h-[100px] w-full mb-2 flex items-center justify-center bg-muted rounded-md border border-border/50">
        <p className="text-sm text-muted-foreground">No route data available</p>
      </div>
    );
  }

  return (
    <div className="h-[100px] w-full mb-2">
      <RouteMap
        center={routeCoordinates[0]}
        zoom={11}
        height="100%"
        className="rounded-md border border-border/50"
        showControls={false}
        routeCoordinates={routeCoordinates}
        mapStyle="default"
        routeStyle={{
          color: "#8B5CF6", // Vivid purple
          weight: 3,
          opacity: 0.8
        }}
      />
    </div>
  );
}
