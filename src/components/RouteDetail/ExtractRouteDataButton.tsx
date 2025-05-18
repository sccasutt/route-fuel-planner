
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin } from "lucide-react";

interface ExtractRouteDataButtonProps {
  routeId: string;
  gpxFileUrl?: string | null;
  fileUrl?: string | null;
  wahooRouteId?: string | null;
  onSuccess?: () => void;
}

export function ExtractRouteDataButton({ 
  routeId, 
  gpxFileUrl, 
  fileUrl, 
  wahooRouteId,
  onSuccess 
}: ExtractRouteDataButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const { toast } = useToast();

  // Don't show the button if we don't have any file URL
  if (!gpxFileUrl && !fileUrl) {
    return null;
  }

  const handleExtractData = async () => {
    try {
      setIsLoading(true);
      setProgress("Starting extraction...");

      // Log the parameters we're sending
      console.log("Extracting data with params:", {
        route_id: routeId,
        wahoo_route_id: wahooRouteId,
        gpx_url: gpxFileUrl,
        file_url: fileUrl
      });

      // Call the gpx-parser edge function to extract and save detailed route points
      const { data, error } = await supabase.functions.invoke("gpx-parser", {
        body: {
          route_id: routeId,
          wahoo_route_id: wahooRouteId,
          gpx_url: gpxFileUrl,
          file_url: fileUrl
        }
      });

      if (error) {
        console.error("Error extracting route data:", error);
        toast({
          title: "Error",
          description: "Failed to extract detailed route data: " + error.message,
          variant: "destructive"
        });
        return;
      }

      console.log("Route data extraction result:", data);

      if (data.success) {
        toast({
          title: "Success",
          description: `Extracted ${data.pointsInserted || 0} route points`,
          variant: "default"
        });

        // Call the onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Warning",
          description: data.message || "No detailed route data could be extracted",
          variant: "default"
        });
      }
    } catch (err) {
      console.error("Error in extract route data process:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred: " + (err instanceof Error ? err.message : String(err)),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExtractData}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {progress || "Extracting..."}
        </>
      ) : (
        <>
          <MapPin className="mr-2 h-4 w-4" /> Extract Route Points
        </>
      )}
    </Button>
  );
}
