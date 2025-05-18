
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface RouteMapSectionProps {
  hasRouteData: boolean;
  mapCenter?: [number, number];
  displayCoordinates?: [number, number][];
}

export function RouteMapSection({ 
  hasRouteData
}: RouteMapSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Map</CardTitle>
        <CardDescription>Map view is currently disabled</CardDescription>
      </CardHeader>
      <CardContent className="h-[320px] bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">
          {hasRouteData 
            ? "Map display is currently disabled." 
            : "No route data available."
          }
        </p>
      </CardContent>
    </Card>
  );
}
