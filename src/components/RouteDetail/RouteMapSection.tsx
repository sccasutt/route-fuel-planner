
import { RouteMapCard } from "@/components/RouteDetail/RouteMapCard";

interface RouteMapSectionProps {
  hasRouteData: boolean;
  mapCenter: [number, number];
  displayCoordinates: [number, number][];
}

export function RouteMapSection({ 
  hasRouteData, 
  mapCenter,
  displayCoordinates
}: RouteMapSectionProps) {
  if (!hasRouteData) {
    return (
      <div className="bg-muted border rounded-lg p-6 h-[400px] flex flex-col items-center justify-center">
        <h3 className="text-lg font-medium mb-2">No Route Data Available</h3>
        <p className="text-muted-foreground text-center">
          This activity doesn't have any GPS coordinates to display.
        </p>
      </div>
    );
  }
  
  return (
    <RouteMapCard 
      coordinates={mapCenter} 
      routeCoordinates={displayCoordinates} 
    />
  );
}
