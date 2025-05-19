
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface RouteMapSectionProps {
  hasRouteData: boolean;
  mapCenter?: [number, number];
  displayCoordinates?: [number, number][];
}

export function RouteMapSection({ 
  hasRouteData,
  mapCenter,
  displayCoordinates
}: RouteMapSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Map</CardTitle>
        <CardDescription>
          {hasRouteData && displayCoordinates && displayCoordinates.length > 0 
            ? `${displayCoordinates.length} route points available`
            : "Map view is currently disabled"}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[320px] bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">
          {hasRouteData 
            ? `Map display is currently disabled. ${displayCoordinates?.length || 0} points loaded.` 
            : "No route data available."
          }
        </p>
      </CardContent>
    </Card>
  );
}
