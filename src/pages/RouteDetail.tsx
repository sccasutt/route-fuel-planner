
import { useParams } from "react-router-dom";
import { useState, useCallback } from "react";
import Layout from "@/components/layout/Layout";
import { RouteHeader } from "@/components/RouteDetail/RouteHeader";
import { RouteSummaryCards } from "@/components/RouteDetail/RouteSummaryCards";
import { RouteMainContent } from "@/components/RouteDetail/RouteMainContent";
import { RouteTabs } from "@/components/RouteDetail/RouteTabs";
import { LoadingState } from "@/components/RouteDetail/LoadingState";
import { NotFoundState } from "@/components/RouteDetail/NotFoundState";
import { useRouteData } from "@/hooks/useRouteData";

const RouteDetail = () => {
  const { id } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const { loading, routeData, routeCoordinates, hasRouteData, mapCenter } = useRouteData(id, refreshKey);

  // Callback for when data extraction is complete
  const handleExtractComplete = useCallback(() => {
    // Increment the refresh key to trigger a re-fetch of data
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  if (!routeData) {
    return <NotFoundState />;
  }

  return (
    <Layout>
      <div className="container py-8">
        <RouteHeader 
          name={routeData.name} 
          date={routeData.date} 
          routeId={routeData.id}
          gpxFileUrl={routeData.gpx_file_url}
          fileUrl={routeData.file_url}
          wahooRouteId={routeData.wahoo_route_id}
          onExtractComplete={handleExtractComplete}
        />
        
        <RouteSummaryCards 
          distance={routeData.distance || 0} 
          elevation={routeData.elevation || 0} 
          duration={routeData.duration || "0:00:00"} 
        />
        
        <RouteMainContent 
          routeData={routeData} 
          hasRouteData={hasRouteData} 
          routeCoordinates={routeCoordinates}
          mapCenter={mapCenter}
        />

        <RouteTabs />
      </div>
    </Layout>
  );
};

export default RouteDetail;
