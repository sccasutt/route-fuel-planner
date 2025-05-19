
import { formatElevation } from "@/lib/utils";
import { RoutePointStats } from "@/hooks/useRoutePoints";

interface ElevationDataColumnProps {
  elevation?: number | null;
  stats?: RoutePointStats | null;
}

export function ElevationDataColumn({ elevation, stats }: ElevationDataColumnProps) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-sm mb-1">Elevation</span>
      <div className="text-lg font-semibold">
        {formatElevation(elevation || 0)}
      </div>
      
      {stats?.elevationGain && (
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
          <span className="flex items-center">
            <span className="text-emerald-500 mr-1">↑</span>
            {formatElevation(stats.elevationGain)}
          </span>
          
          <span className="flex items-center">
            <span className="text-rose-500 mr-1">↓</span>
            {formatElevation(stats.elevationLoss || 0)}
          </span>
        </div>
      )}
    </div>
  );
}
