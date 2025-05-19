
import { Calendar } from "lucide-react";
import { formatShortDate } from "@/lib/utils";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { extractAndStoreRoutePoints } from "@/utils/routeProcessing";

interface RouteHeaderProps {
  name: string;
  date: string;
  routeId?: string;
  gpxFileUrl?: string | null;
  fileUrl?: string | null;
  wahooRouteId?: string | null;
  onExtractComplete?: () => void;
}

export function RouteHeader({ 
  name, 
  date, 
  routeId,
  gpxFileUrl,
  fileUrl,
  wahooRouteId,
  onExtractComplete
}: RouteHeaderProps) {
  const { toast } = useToast();

  // Function to extract route data
  const extractRouteData = async () => {
    if (!routeId || (!gpxFileUrl && !fileUrl)) {
      console.log("Missing required data for extraction:", { routeId, gpxFileUrl, fileUrl });
      return;
    }

    try {
      console.log("Starting route data extraction for route:", routeId);
      console.log("Using file URLs:", { gpxFileUrl, fileUrl, wahooRouteId });
      
      // Call our Edge Function to parse the GPX file
      const { data, error } = await supabase.functions.invoke("gpx-parser", {
        body: { 
          gpx_url: gpxFileUrl, 
          file_url: fileUrl,
          route_id: routeId,  // Database ID for storing points
          wahoo_route_id: wahooRouteId  // Wahoo ID for fetching the file
        }
      });
      
      if (error) {
        console.error("Error extracting route data:", error);
        return;
      }
      
      console.log("Route data extraction successful:", data);
      
      // After extracting GPX data, also make sure to extract and store route points
      await extractPoints();
      
      if (onExtractComplete) {
        onExtractComplete();
      }
    } catch (err) {
      console.error("Error during route data extraction:", err);
    }
  };

  // Function to extract and store route points
  const extractPoints = async () => {
    if (!routeId) return;
    
    try {
      console.log("Automatically extracting route points for route:", routeId);
      const success = await extractAndStoreRoutePoints(routeId);
      
      if (success) {
        console.log("Route points successfully extracted and stored");
        // Only show toast for successful extraction if we didn't previously have points
        const { count } = await supabase
          .from('route_points')
          .select('id', { count: 'exact', head: true })
          .eq('route_id', routeId);
          
        if (count && count > 0) {
          console.log(`Successfully extracted ${count} route points`);
        }
      } else {
        console.warn("Could not extract route points from available data");
      }
    } catch (err) {
      console.error("Error extracting route points:", err);
    }
  };

  // Automatically extract points when component mounts
  useEffect(() => {
    if (routeId) {
      console.log("Automatically checking and extracting route points on mount");
      
      // First check if route already has points
      supabase
        .from('route_points')
        .select('id', { count: 'exact', head: true })
        .eq('route_id', routeId)
        .then(({ count, error }) => {
          if (error) {
            console.error("Error checking for route points:", error);
            return;
          }
          
          // If we don't have points yet, extract them
          if (!count || count === 0) {
            console.log("No route points found, extracting them now");
            extractRouteData();
          } else {
            console.log(`Route already has ${count} points, skipping extraction`);
          }
        });
    }
  }, [routeId, gpxFileUrl, fileUrl]);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{name}</h1>
        <div className="flex items-center text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{formatShortDate(date)}</span>
        </div>
      </div>
    </div>
  );
}
