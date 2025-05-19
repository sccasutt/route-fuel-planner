
import { RouteMapSection } from "@/components/RouteDetail/RouteMapSection";
import { SideBarDataSection } from "@/components/RouteDetail/SideBarDataSection";
import { ElevationSection } from "@/components/RouteDetail/ElevationSection";
import { useRoutePoints } from "@/hooks/useRoutePoints";
import { useEffect } from "react";

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
  // Use the hook to fetch detailed route points
  const { points, loading: loadingPoints, stats } = useRoutePoints(routeData?.id);

  // If we have detailed point data, show that. Otherwise, fall back to route coordinates
  const displayCoordinates = points.length > 0 ? 
    points.map(p => [p.lat, p.lng] as [number, number]) : 
    routeCoordinates;

  const hasDetailedPoints = points.length > 0;
  
  // Log when route points are available
  useEffect(() => {
    if (hasDetailedPoints) {
      console.log(`Using ${points.length} detailed route points for display`);
    } else if (routeCoordinates.length > 0) {
      console.log(`No detailed points available, falling back to ${routeCoordinates.length} basic coordinates`);
    } else {
      console.log('No route coordinates available for display');
    }
  }, [hasDetailedPoints, points.length, routeCoordinates.length]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2 space-y-6">
        <RouteMapSection 
          hasRouteData={hasRouteData}
          mapCenter={mapCenter}
          displayCoordinates={displayCoordinates}
          routeId={routeData?.id}
        />
        
        <ElevationSection 
          points={points} 
          hasDetailedPoints={hasDetailedPoints} 
        />
      </div>

      <SideBarDataSection 
        routeData={routeData} 
        stats={stats} 
      />
    </div>
  );
}
