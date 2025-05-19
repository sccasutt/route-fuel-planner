
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { extractAndStoreRoutePoints } from "@/utils/routeProcessing";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RouteMapSectionProps {
  hasRouteData: boolean;
  mapCenter?: [number, number];
  displayCoordinates?: [number, number][];
  routeId?: string;
}

export function RouteMapSection({ 
  hasRouteData,
  mapCenter,
  displayCoordinates,
  routeId
}: RouteMapSectionProps) {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  
  const handleExtractPoints = async () => {
    if (!routeId) return;
    
    setProcessing(true);
    try {
      const success = await extractAndStoreRoutePoints(routeId);
      
      if (success) {
        toast({
          title: "Points extracted",
          description: "Route points have been successfully extracted and stored.",
        });
        // Reload the page to refresh the data
        window.location.reload();
      } else {
        toast({
          title: "Extraction failed",
          description: "Could not extract route points from the available data.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error extracting route points:", err);
      toast({
        title: "Error",
        description: "An error occurred while processing route data.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Route Map</CardTitle>
            <CardDescription>
              {hasRouteData && displayCoordinates && displayCoordinates.length > 0 
                ? `${displayCoordinates.length} route points available`
                : "Map view is currently disabled"}
            </CardDescription>
          </div>
          
          {!displayCoordinates || displayCoordinates.length === 0 ? (
            <Button 
              variant="outline"
              size="sm"
              onClick={handleExtractPoints}
              disabled={processing || !routeId}
              className="flex gap-2 items-center"
            >
              <RefreshCw className={`h-4 w-4 ${processing ? "animate-spin" : ""}`} />
              {processing ? "Extracting..." : "Extract Points"}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="h-[320px] bg-muted flex items-center justify-center">
        {processing ? (
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Extracting route points...</p>
          </div>
        ) : (
          <p className="text-muted-foreground">
            {hasRouteData 
              ? `Map display is currently disabled. ${displayCoordinates?.length || 0} points loaded.` 
              : "No route data available."
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
}
