
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import RouteMap from "@/components/Map/RouteMap";

interface RouteMapSectionProps {
  hasRouteData: boolean;
  mapCenter?: [number, number];
  displayCoordinates?: [number, number][];
  routeId?: string;
}

export function RouteMapSection({ 
  hasRouteData,
  mapCenter = [51.505, -0.09],
  displayCoordinates = [],
  routeId
}: RouteMapSectionProps) {
  const [pointCount, setPointCount] = useState<number>(0);

  // Update point count when coordinates change
  useEffect(() => {
    if (displayCoordinates && displayCoordinates.length > 0) {
      setPointCount(displayCoordinates.length);
      console.log(`RouteMapSection: ${displayCoordinates.length} route points available`);
    } else {
      console.log(`RouteMapSection: No route points available`);
    }
  }, [displayCoordinates]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Route Map</CardTitle>
            <CardDescription>
              {hasRouteData && displayCoordinates && displayCoordinates.length > 0 
                ? `${pointCount} route points displayed`
                : "Loading route data..."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!hasRouteData || !displayCoordinates || displayCoordinates.length === 0 ? (
          <div className="h-[320px] bg-muted flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading route points...</p>
            </div>
          </div>
        ) : (
          <RouteMap 
            center={mapCenter}
            routeCoordinates={displayCoordinates}
            height="320px"
            className="rounded-b-lg"
            zoom={13}
            mapStyle="terrain"
          />
        )}
      </CardContent>
    </Card>
  );
}
