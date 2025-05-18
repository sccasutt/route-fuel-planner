
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface RouteMapCardProps {
  coordinates: [number, number];
  routeCoordinates: [number, number][];
  mapStyle?: 'default' | 'terrain' | 'satellite' | 'dark';
}

export function RouteMapCard({ 
  mapStyle = 'terrain' 
}: RouteMapCardProps) {
  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Route Map</CardTitle>
        <CardDescription>Map view is currently disabled</CardDescription>
      </CardHeader>
      <CardContent className="p-0 h-[320px] flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Map display is currently disabled</p>
      </CardContent>
    </Card>
  );
}
