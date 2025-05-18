
import { Mountain } from "lucide-react";
import { ActivityDataCard } from "@/components/RouteDetail/ActivityDataCard";
import { formatElevation } from "@/lib/utils";
import { RoutePointStats } from "@/hooks/useRoutePoints";

interface ElevationDataColumnProps {
  routeData: any;
  stats: RoutePointStats;
}

export function ElevationDataColumn({ routeData, stats }: ElevationDataColumnProps) {
  // Define elevation items for ActivityDataCard
  const elevationItems = [
    {
      label: "Max Elevation",
      value: stats.maxElevation ? formatElevation(stats.maxElevation) : 
             routeData.max_elevation ? formatElevation(routeData.max_elevation) : "N/A",
      icon: Mountain
    },
    {
      label: "Total Ascent",
      value: stats.totalAscent > 0 ? formatElevation(stats.totalAscent) : 
             routeData.total_ascent ? formatElevation(routeData.total_ascent) : 
             formatElevation(routeData.elevation || 0),
      icon: Mountain
    }
  ];

  return <ActivityDataCard title="Elevation" items={elevationItems} />;
}
