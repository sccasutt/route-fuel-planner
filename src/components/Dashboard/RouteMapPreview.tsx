
import React from "react";

interface RouteMapPreviewProps {
  routeCoordinates?: [number, number][];
  hasValidCoordinates: boolean;
  height?: string;
  routeType?: string;
}

export function RouteMapPreview({ 
  height = "100px",
  routeType = "activity"
}: RouteMapPreviewProps) {
  return (
    <div className="h-[100px] w-full mb-2 flex items-center justify-center bg-muted rounded-md border border-border/50">
      <p className="text-sm text-muted-foreground">Map view disabled</p>
    </div>
  );
}
