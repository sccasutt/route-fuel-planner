
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface RouteMapSectionProps {
  hasRouteData: boolean;
  mapCenter?: [number, number];
  displayCoordinates?: [number, number][];
  routeId?: string;
}

export function RouteMapSection({ 
  hasRouteData,
  mapCenter,
  displayCoordinates,
  routeId
}: RouteMapSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Route Map</CardTitle>
            <CardDescription>
              {hasRouteData && displayCoordinates && displayCoordinates.length > 0 
                ? `${displayCoordinates.length} route points available`
                : "Map view is currently disabled"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[320px] bg-muted flex items-center justify-center">
        {!hasRouteData || !displayCoordinates || displayCoordinates.length === 0 ? (
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading route points...</p>
          </div>
        ) : (
          <p className="text-muted-foreground">
            {`Map display is currently disabled. ${displayCoordinates?.length || 0} points loaded.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
