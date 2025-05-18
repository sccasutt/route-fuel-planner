
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import RouteMap from "@/components/Map/RouteMap";

interface RouteMapCardProps {
  coordinates: [number, number];
  routeCoordinates: [number, number][];
}

export function RouteMapCard({ coordinates, routeCoordinates }: RouteMapCardProps) {
  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Route Map</CardTitle>
        <CardDescription>Elevation profile and route details</CardDescription>
      </CardHeader>
      <CardContent className="p-0 h-[320px]">
        <RouteMap 
          center={coordinates} 
          zoom={13}
          height="100%"
          className="rounded-b-lg"
          routeCoordinates={routeCoordinates}
          showControls={true}
        />
      </CardContent>
    </Card>
  );
}
