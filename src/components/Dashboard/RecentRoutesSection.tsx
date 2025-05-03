
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Map, TrendingUp, Clock, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface RouteType {
  id: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  calories: number;
}

interface Props {
  routes: RouteType[];
}

export function RecentRoutesSection({ routes }: Props) {
  return (
    <div className="p-6 bg-muted rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Routes</h2>
        <Link to="/routes">
          <Button variant="outline" size="sm">View All</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routes.map((route) => (
          <Card key={route.id} className="overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{route.name}</CardTitle>
              <CardDescription>{route.date}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <Map className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{route.distance} km</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{route.elevation} m</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{route.duration}</span>
                </div>
                <div className="flex items-center">
                  <LineChart className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{route.calories} kcal</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link to={`/routes/${route.id}`}>
                <Button variant="ghost" size="sm">View Details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
