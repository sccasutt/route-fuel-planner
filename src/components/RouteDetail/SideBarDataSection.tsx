
import { WeatherDataCard } from "@/components/RouteDetail/WeatherDataCard";
import { EnergyPowerDataColumn } from "@/components/RouteDetail/DataColumns/EnergyPowerDataColumn";
import { ElevationDataColumn } from "@/components/RouteDetail/DataColumns/ElevationDataColumn";
import { RoutePointStats } from "@/hooks/useRoutePoints";

interface SideBarDataSectionProps {
  routeData: any;
  stats: RoutePointStats;
}

export function SideBarDataSection({ routeData, stats }: SideBarDataSectionProps) {
  return (
    <div className="space-y-6">
      <EnergyPowerDataColumn routeData={routeData} />
      <ElevationDataColumn routeData={routeData} stats={stats} />
      <WeatherDataCard />
    </div>
  );
}
