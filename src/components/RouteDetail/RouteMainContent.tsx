
import { RouteMapCard } from "@/components/RouteDetail/RouteMapCard";
import { ActivityDataCard } from "@/components/RouteDetail/ActivityDataCard";
import { WeatherDataCard } from "@/components/RouteDetail/WeatherDataCard";
import { ElevationProfileCard } from "@/components/RouteDetail/ElevationProfileCard"; // We'll create this next
import { LineChart, Bike, Mountain } from "lucide-react";
import { useRoutePoints } from "@/hooks/useRoutePoints";
import { formatElevation } from "@/lib/utils";

interface RouteMainContentProps {
  routeData: any;
  hasRouteData: boolean;
  routeCoordinates: [number, number][];
  mapCenter: [number, number];
}

export function RouteMainContent({ 
  routeData, 
  hasRouteData, 
  routeCoordinates,
  mapCenter
}: RouteMainContentProps) {
  // Use the new hook to fetch detailed route points
  const { points, loading: loadingPoints, stats } = useRoutePoints(routeData?.id);

  // Define energy & power items for ActivityDataCard
  const energyPowerItems = [
    {
      label: "Calories",
      value: `${routeData.calories || 0} kcal`,
      icon: LineChart
    },
    {
      label: "Avg Speed",
      value: routeData.distance && routeData.duration_seconds ? 
        `${((routeData.distance / (routeData.duration_seconds / 3600))).toFixed(1)} km/h` : 
        "N/A",
      icon: Bike
    },
    {
      label: "Max Speed",
      value: routeData.max_speed ? `${routeData.max_speed} km/h` : "N/A",
      icon: Bike
    }
  ];

  // Define elevation items for ActivityDataCard
  const elevationItems = [
    {
      label: "Max Elevation",
      value: stats.maxElevation ? formatElevation(stats.maxElevation) : routeData.max_elevation ? formatElevation(routeData.max_elevation) : "N/A",
      icon: Mountain
    },
    {
      label: "Total Ascent",
      value: stats.totalAscent > 0 ? formatElevation(stats.totalAscent) : routeData.total_ascent ? formatElevation(routeData.total_ascent) : formatElevation(routeData.elevation || 0),
      icon: Mountain
    }
  ];

  // If we have detailed point data, show that. Otherwise, fall back to route coordinates
  const displayCoordinates = points.length > 0 ? 
    points.map(p => [p.lat, p.lng] as [number, number]) : 
    routeCoordinates;

  const hasDetailedPoints = points.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2 space-y-6">
        {hasRouteData ? (
          <RouteMapCard 
            coordinates={mapCenter} 
            routeCoordinates={displayCoordinates} 
          />
        ) : (
          <div className="bg-muted border rounded-lg p-6 h-[400px] flex flex-col items-center justify-center">
            <h3 className="text-lg font-medium mb-2">No Route Data Available</h3>
            <p className="text-muted-foreground text-center">
              This activity doesn't have any GPS coordinates to display.
            </p>
          </div>
        )}

        {/* Show elevation profile if we have detailed points with elevation data */}
        {hasDetailedPoints && points.some(p => p.elevation !== null) && (
          <ElevationProfileCard points={points} />
        )}
      </div>

      <div className="space-y-6">
        <ActivityDataCard 
          title="Energy & Power" 
          items={energyPowerItems} 
        />

        <ActivityDataCard 
          title="Elevation" 
          items={elevationItems} 
        />
        
        <WeatherDataCard />
      </div>
    </div>
  );
}
