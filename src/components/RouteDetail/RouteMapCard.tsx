
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import RouteMap from "@/components/Map/RouteMap";

interface RouteMapCardProps {
  coordinates: [number, number];
  routeCoordinates: [number, number][];
  mapStyle?: 'default' | 'terrain' | 'satellite' | 'dark';
}

export function RouteMapCard({ 
  coordinates, 
  routeCoordinates, 
  mapStyle = 'terrain' 
}: RouteMapCardProps) {
  // Determine if we have valid route coordinates
  const hasValidRoute = routeCoordinates && routeCoordinates.length >= 2;
  
  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Route Map</CardTitle>
        <CardDescription>Elevation profile and route details</CardDescription>
      </CardHeader>
      <CardContent className="p-0 h-[320px]">
        {hasValidRoute ? (
          <RouteMap 
            center={coordinates} 
            zoom={13}
            height="100%"
            className="rounded-b-lg"
            routeCoordinates={routeCoordinates}
            showControls={true}
            mapStyle={mapStyle}
            routeStyle={{
              color: "#8B5CF6", // Vivid purple
              weight: 5,
              opacity: 0.85
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted rounded-b-lg">
            <p className="text-muted-foreground">No route data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
