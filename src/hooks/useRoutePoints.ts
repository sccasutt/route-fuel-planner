
import { useState, useEffect } from 'react';
import { fetchRoutePoints } from '@/services/routeDataService';

export interface RoutePoint {
  lat: number;
  lng: number;
  elevation: number | null;
  sequence_index?: number;
  recorded_at?: string | null;
  power?: number | null;
  heart_rate?: number | null;
  cadence?: number | null;
}

export interface RoutePointStats {
  maxElevation: number | null;
  minElevation: number | null;
  elevationGain: number | null;
  elevationLoss: number | null;
}

/**
 * Hook to fetch and process route points from the database
 */
export function useRoutePoints(routeId: string | undefined) {
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RoutePointStats>({
    maxElevation: null,
    minElevation: null,
    elevationGain: null,
    elevationLoss: null
  });

  useEffect(() => {
    async function getRoutePoints() {
      if (!routeId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      console.log(`Fetching route points for route ID: ${routeId}`);

      try {
        const fetchedPoints = await fetchRoutePoints(routeId);
        console.log(`Fetched ${fetchedPoints.length} route points for route ${routeId}`);
        
        if (fetchedPoints.length > 0) {
          // Sample the first point to see its structure
          console.log(`Sample route point:`, fetchedPoints[0]);
          
          setPoints(fetchedPoints);
          
          // Calculate elevation stats if we have elevation data
          calculateElevationStats(fetchedPoints);
        } else {
          console.log('No route points found for this route');
          
          // If no points found, attempt to trigger extraction (handled in RouteHeader now)
          console.log('Route header component will handle point extraction');
        }
      } catch (err) {
        console.error('Error fetching route points:', err);
        setError('Failed to load route points');
      } finally {
        setLoading(false);
      }
    }

    getRoutePoints();
  }, [routeId]);

  /**
   * Calculate elevation statistics from route points
   */
  const calculateElevationStats = (points: RoutePoint[]) => {
    // Filter out points with null elevation
    const pointsWithElevation = points.filter(p => p.elevation !== null);
    
    if (pointsWithElevation.length === 0) {
      return;
    }

    // Get min and max elevation
    const elevations = pointsWithElevation.map(p => p.elevation as number);
    const maxElevation = Math.max(...elevations);
    const minElevation = Math.min(...elevations);
    
    // Calculate elevation gain and loss
    let elevationGain = 0;
    let elevationLoss = 0;
    
    for (let i = 1; i < pointsWithElevation.length; i++) {
      const diff = (pointsWithElevation[i].elevation as number) - 
                   (pointsWithElevation[i-1].elevation as number);
      
      if (diff > 0) {
        elevationGain += diff;
      } else {
        elevationLoss += Math.abs(diff);
      }
    }

    console.log(`Elevation stats calculated - gain: ${elevationGain.toFixed(2)}m, loss: ${elevationLoss.toFixed(2)}m`);
    setStats({
      maxElevation,
      minElevation,
      elevationGain,
      elevationLoss
    });
  };

  return { points, loading, error, stats };
}
