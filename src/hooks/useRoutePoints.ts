
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface RoutePoint {
  id: number;
  route_id: string;
  sequence_index: number;
  lat: number;
  lng: number;
  elevation: number | null;
  recorded_at: string | null;
}

export interface RoutePointStats {
  minElevation: number | null;
  maxElevation: number | null;
  totalAscent: number;
  totalDescent: number;
}

/**
 * Hook to fetch detailed route points for a given route
 */
export function useRoutePoints(routeId: string | undefined) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RoutePointStats>({
    minElevation: null,
    maxElevation: null,
    totalAscent: 0,
    totalDescent: 0,
  });

  useEffect(() => {
    const fetchRoutePoints = async () => {
      if (!routeId) {
        setLoading(false);
        setPoints([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from("route_points")
          .select("*")
          .eq("route_id", routeId)
          .order("sequence_index", { ascending: true });

        if (fetchError) {
          console.error("Error fetching route points:", fetchError);
          setError("Failed to load route points");
          toast({
            title: "Error",
            description: "Failed to load detailed route data",
            variant: "destructive",
          });
          return;
        }

        if (!data || data.length === 0) {
          console.log("No route points found for route:", routeId);
          setPoints([]);
          return;
        }

        const typedPoints: RoutePoint[] = data.map((point) => ({
          id: point.id,
          route_id: point.route_id,
          sequence_index: point.sequence_index,
          lat: Number(point.lat),
          lng: Number(point.lng),
          elevation: point.elevation !== null ? Number(point.elevation) : null,
          recorded_at: point.recorded_at,
        }));

        setPoints(typedPoints);
        
        // Calculate elevation statistics if we have elevation data
        if (typedPoints.some(p => p.elevation !== null)) {
          const validElevations = typedPoints.filter(p => p.elevation !== null).map(p => p.elevation as number);
          
          const minElevation = validElevations.length > 0 ? Math.min(...validElevations) : null;
          const maxElevation = validElevations.length > 0 ? Math.max(...validElevations) : null;
          
          // Calculate total ascent and descent
          let totalAscent = 0;
          let totalDescent = 0;
          
          for (let i = 1; i < typedPoints.length; i++) {
            const prevElevation = typedPoints[i-1].elevation;
            const currElevation = typedPoints[i].elevation;
            
            if (prevElevation !== null && currElevation !== null) {
              const diff = currElevation - prevElevation;
              if (diff > 0) {
                totalAscent += diff;
              } else {
                totalDescent += Math.abs(diff);
              }
            }
          }
          
          setStats({
            minElevation,
            maxElevation,
            totalAscent,
            totalDescent,
          });
        }

      } catch (err) {
        console.error("Unexpected error in useRoutePoints:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRoutePoints();
  }, [routeId, toast]);

  return {
    points,
    loading,
    error,
    stats,
    // Helper function to convert points to a format suitable for leaflet polyline
    toLineCoordinates: () => points.map(p => [p.lat, p.lng] as [number, number]),
  };
}
