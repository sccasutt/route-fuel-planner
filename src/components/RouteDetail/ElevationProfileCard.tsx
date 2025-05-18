
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoutePoint } from "@/hooks/useRoutePoints";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDistance, formatElevation } from "@/lib/utils";

interface ElevationProfileCardProps {
  points: RoutePoint[];
}

export function ElevationProfileCard({ points }: ElevationProfileCardProps) {
  const chartData = useMemo(() => {
    // Filter points with valid elevation data
    const validPoints = points.filter(p => p.elevation !== null);
    
    if (validPoints.length <= 1) {
      return [];
    }

    // Calculate distance from start for each point
    let cumulativeDistance = 0;
    const data = validPoints.map((point, index) => {
      if (index > 0) {
        // Calculate distance from previous point using Haversine formula
        const prevPoint = validPoints[index - 1];
        const distance = calculateDistance(
          prevPoint.lat,
          prevPoint.lng,
          point.lat,
          point.lng
        );
        cumulativeDistance += distance;
      }

      return {
        distance: cumulativeDistance,
        elevation: point.elevation,
        distanceKm: (cumulativeDistance / 1000).toFixed(2),
      };
    });

    return data;
  }, [points]);

  if (chartData.length <= 1) {
    return null; // Don't render if we don't have enough data points
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Elevation Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="distance"
                name="Distance"
                tickFormatter={(value) => formatDistance(value / 1000)}
                stroke="#888"
                fontSize={12}
              />
              <YAxis
                name="Elevation"
                tickFormatter={(value) => formatElevation(value, false)}
                stroke="#888"
                fontSize={12}
                width={40}
              />
              <Tooltip
                formatter={(value: number) => formatElevation(value)}
                labelFormatter={(value) => `Distance: ${formatDistance(value / 1000)}`}
              />
              <Area
                type="monotone"
                dataKey="elevation"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Haversine formula to calculate distance between two points in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
