
import { Calendar } from "lucide-react";
import { formatShortDate } from "@/lib/utils";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
        toast({
          title: "Error",
          description: "Failed to extract route data",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Route data extraction successful:", data);
      
      if (onExtractComplete) {
        onExtractComplete();
      }
    } catch (err) {
      console.error("Error during route data extraction:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Automatically attempt to extract route data when component mounts
  useEffect(() => {
    if (routeId && (gpxFileUrl || fileUrl)) {
      console.log("Automatically extracting route data on mount");
      extractRouteData();
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
