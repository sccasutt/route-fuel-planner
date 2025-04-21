
import { Card } from "@/components/ui/card";
import { Bike, Map, TrendingUp, Clock, LineChart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface RouteType {
  id: number;
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

export function RoutesTabContent({ routes }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Routes</h2>
        <div className="flex gap-4">
          <Button variant="outline" className="gap-2">
            <Bike className="h-4 w-4" />
            Import from Wahoo
          </Button>
          <Button className="gap-2">
            <Map className="h-4 w-4" />
            Plan New Route
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {routes.map((route) => (
          <Card key={route.id} className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4">
              <div className="bg-muted p-6 flex flex-col justify-center">
                <h3 className="font-semibold text-lg">{route.name}</h3>
                <p className="text-sm text-muted-foreground">{route.date}</p>
              </div>
              <div className="col-span-3 p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Map className="w-4 h-4 mr-1" />
                      <span>Distance</span>
                    </div>
                    <p className="font-semibold">{route.distance} km</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span>Elevation</span>
                    </div>
                    <p className="font-semibold">{route.elevation} m</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Duration</span>
                    </div>
                    <p className="font-semibold">{route.duration}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <LineChart className="w-4 h-4 mr-1" />
                      <span>Calories</span>
                    </div>
                    <p className="font-semibold">{route.calories} kcal</p>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Link to={`/routes/${route.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
