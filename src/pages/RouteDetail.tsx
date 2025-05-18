
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { RouteHeader } from "@/components/RouteDetail/RouteHeader";
import { RouteSummaryCards } from "@/components/RouteDetail/RouteSummaryCards";
import { RouteMainContent } from "@/components/RouteDetail/RouteMainContent";
import { RouteTabs } from "@/components/RouteDetail/RouteTabs";
import { LoadingState } from "@/components/RouteDetail/LoadingState";
import { NotFoundState } from "@/components/RouteDetail/NotFoundState";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const RouteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [hasRouteData, setHasRouteData] = useState(false);

  useEffect(() => {
    const fetchRouteData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch the route data from the database
        const { data: route, error } = await supabase
          .from('routes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error("Error fetching route:", error);
          toast({ 
            title: "Error", 
            description: "Failed to load route data", 
            variant: "destructive" 
          });
          navigate('/dashboard');
          return;
        }

        if (!route) {
          toast({ 
            title: "Not Found", 
            description: "Route not found", 
            variant: "destructive" 
          });
          navigate('/dashboard');
          return;
        }

        console.log("Fetched route data:", route);
        setRouteData(route);
        
        // Parse GPS coordinates from gpx_data
        let coordinates: [number, number][] = [];
        let hasValidData = false;
        
        if (route.gpx_data) {
          try {
            // Try to parse the gpx_data field
            let parsedData;
            try {
              // Handle both string and object formats
              parsedData = typeof route.gpx_data === 'string' 
                ? JSON.parse(route.gpx_data) 
                : route.gpx_data;
              
              console.log("Successfully parsed GPX data:", typeof parsedData);
            } catch (parseErr) {
              console.error("GPX data is not valid JSON:", parseErr);
              console.log("Raw GPX data type:", typeof route.gpx_data);
              console.log("Raw GPX data sample:", 
                typeof route.gpx_data === 'string' 
                  ? route.gpx_data.substring(0, 100) + '...' 
                  : route.gpx_data
              );
            }
            
            // If we successfully parsed JSON data
            if (parsedData) {
              // First try new format where coordinates are directly in the top level
              if (parsedData.coordinates && Array.isArray(parsedData.coordinates)) {
                // Ensure each coordinate is a valid [lat, lng] tuple
                coordinates = parsedData.coordinates
                  .filter((coord: any) => 
                    Array.isArray(coord) && 
                    coord.length === 2 &&
                    typeof coord[0] === 'number' && 
                    typeof coord[1] === 'number')
                  .map((coord: number[]) => [coord[0], coord[1]] as [number, number]);
                
                hasValidData = coordinates.length >= 2;
                console.log(`Extracted ${coordinates.length} valid coordinates from JSON gpx_data`);
              }
              // If no coordinates found in top level, check if they're in a raw_gpx field
              else if (parsedData.raw_gpx) {
                try {
                  const rawGpx = typeof parsedData.raw_gpx === 'string'
                    ? JSON.parse(parsedData.raw_gpx)
                    : parsedData.raw_gpx;
                    
                  if (rawGpx && rawGpx.coordinates && Array.isArray(rawGpx.coordinates)) {
                    coordinates = rawGpx.coordinates
                      .filter((coord: any) => 
                        Array.isArray(coord) && 
                        coord.length === 2 &&
                        typeof coord[0] === 'number' && 
                        typeof coord[1] === 'number')
                      .map((coord: number[]) => [coord[0], coord[1]] as [number, number]);
                    
                    hasValidData = coordinates.length >= 2;
                    console.log(`Extracted ${coordinates.length} valid coordinates from raw_gpx field`);
                  }
                } catch (err) {
                  console.error("Failed to parse raw_gpx data:", err);
                }
              }
            }
          } catch (err) {
            console.error("Failed to process GPX data:", err);
          }
        }
        
        if (!hasValidData) {
          console.log("No valid route coordinates found, using fallback mock data");
          // Fallback to mock data if no valid coordinates
          coordinates = [
            [51.505, -0.09],
            [51.51, -0.1],
            [51.52, -0.12],
            [51.518, -0.14],
            [51.51, -0.15],
            [51.5, -0.14],
            [51.495, -0.12],
            [51.505, -0.09],
          ];
        }
        
        setRouteCoordinates(coordinates);
        setHasRouteData(hasValidData);
      } catch (err) {
        console.error("Error in route data fetch:", err);
        toast({ 
          title: "Error", 
          description: "An unexpected error occurred", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRouteData();
  }, [id, navigate, toast]);

  if (loading) {
    return <LoadingState />;
  }

  if (!routeData) {
    return <NotFoundState />;
  }

  // Get center coordinates for the map from the route data
  // Ensure we have a valid tuple with exactly 2 elements for the map center
  const mapCenter: [number, number] = routeCoordinates.length > 0 
    ? [routeCoordinates[0][0], routeCoordinates[0][1]] 
    : [51.505, -0.09]; // Default fallback if no coordinates

  return (
    <Layout>
      <div className="container py-8">
        <RouteHeader name={routeData.name} date={routeData.date} />
        
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
