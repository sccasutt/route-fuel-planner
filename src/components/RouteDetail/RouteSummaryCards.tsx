
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Map, TrendingUp, Bike } from "lucide-react";

interface RouteSummaryCardsProps {
  distance: number;
  elevation: number;
  duration: string;
}

export function RouteSummaryCards({ distance, elevation, duration }: RouteSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <Map className="w-5 h-5 mr-2 text-primary" />
            Distance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{distance} km</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            Elevation Gain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{elevation} m</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <Bike className="w-5 h-5 mr-2 text-primary" />
            Duration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{duration}</div>
        </CardContent>
      </Card>
    </div>
  );
}
