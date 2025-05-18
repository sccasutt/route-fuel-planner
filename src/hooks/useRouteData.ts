
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { RouteData } from "@/types/routeData";
import { fetchRouteData, extractRouteCoordinates, fetchCoordinatesFromFileUrl } from "@/services/routeDataService";
import { getFallbackCoordinates } from "@/utils/coordinateUtils";

/**
 * Hook to fetch and process route data
 * @param routeId ID of the route to fetch
 * @param refreshKey A key that triggers data refresh when changed
 */
export function useRouteData(routeId: string | undefined, refreshKey: number = 0) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [hasRouteData, setHasRouteData] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]); // Default fallback

  useEffect(() => {
    const fetchRouteDataAndCoordinates = async () => {
      if (!routeId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch the route data from the database
        const data = await fetchRouteData(routeId);

        if (!data) {
          toast({ 
            title: "Not Found", 
            description: "Route not found", 
            variant: "destructive" 
          });
          navigate('/dashboard');
          return;
        }

        console.log("Fetched route data:", data);
        setRouteData(data);
        
        // Extract coordinates from various sources
        let { coordinates, hasValidData } = await extractRouteCoordinates(data);
        
        // If we still don't have valid data and we have a GPX file URL, download and parse it
        if ((!hasValidData || coordinates.length < 2) && (data.gpx_file_url || data.file_url)) {
          const fileCoordinates = await fetchCoordinatesFromFileUrl(
            data.id, 
            data.gpx_file_url, 
            data.file_url
          );
          
          if (fileCoordinates.length >= 2) {
            coordinates = fileCoordinates;
            hasValidData = true;
          }
        }
        
        // If trying to get data from the start_lat and start_lng fields
        if ((!hasValidData || coordinates.length < 2) && data.start_lat && data.start_lng) {
          // Use the start coordinates as a fallback
          coordinates = [
            [Number(data.start_lat), Number(data.start_lng)]
          ];
          console.log("Using start_lat/start_lng as fallback coordinates");
        }
        
        if (!hasValidData) {
          console.log("No valid route coordinates found, using fallback mock data");
          // Fallback to mock data if no valid coordinates
          coordinates = getFallbackCoordinates();
        }
        
        setRouteCoordinates(coordinates);
        setHasRouteData(hasValidData);
        
        // Set map center based on first coordinate
        if (coordinates.length > 0) {
          setMapCenter([coordinates[0][0], coordinates[0][1]]);
        }
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

    fetchRouteDataAndCoordinates();
  }, [routeId, navigate, toast, refreshKey]); // Added refreshKey to the dependencies

  return { 
    loading, 
    routeData, 
    routeCoordinates, 
    hasRouteData, 
    mapCenter 
  };
}
