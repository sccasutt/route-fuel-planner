
import { ElevationProfileCard } from "@/components/RouteDetail/ElevationProfileCard";
import { RoutePoint } from "@/hooks/useRoutePoints";

interface ElevationSectionProps {
  points: RoutePoint[];
  hasDetailedPoints: boolean;
}

export function ElevationSection({ points, hasDetailedPoints }: ElevationSectionProps) {
  // Only render if we have detailed points with elevation data
  if (!hasDetailedPoints || !points.some(p => p.elevation !== null)) {
    return null;
  }
  
  return <ElevationProfileCard points={points} />;
}
