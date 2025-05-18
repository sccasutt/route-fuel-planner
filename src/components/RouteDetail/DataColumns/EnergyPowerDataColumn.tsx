
import { LineChart, Bike } from "lucide-react";
import { ActivityDataCard } from "@/components/RouteDetail/ActivityDataCard";

interface EnergyPowerDataColumnProps {
  routeData: any;
}

export function EnergyPowerDataColumn({ routeData }: EnergyPowerDataColumnProps) {
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

  return <ActivityDataCard title="Energy & Power" items={energyPowerItems} />;
}
