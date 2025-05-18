
import { RouteMapCard } from "@/components/RouteDetail/RouteMapCard";
import { ActivityDataCard } from "@/components/RouteDetail/ActivityDataCard";
import { WeatherDataCard } from "@/components/RouteDetail/WeatherDataCard";
import { LineChart, Bike } from "lucide-react";

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2">
        {hasRouteData ? (
          <RouteMapCard 
            coordinates={mapCenter} 
            routeCoordinates={routeCoordinates} 
          />
        ) : (
          <div className="bg-muted border rounded-lg p-6 h-[400px] flex flex-col items-center justify-center">
            <h3 className="text-lg font-medium mb-2">No Route Data Available</h3>
            <p className="text-muted-foreground text-center">
              This activity doesn't have any GPS coordinates to display.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <ActivityDataCard 
          title="Energy & Power" 
          items={energyPowerItems} 
        />
        <WeatherDataCard />
      </div>
    </div>
  );
}
