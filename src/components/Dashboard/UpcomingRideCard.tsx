
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, Map, TrendingUp, Clock, BarChart, Droplet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function UpcomingRideCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-secondary" />
          Upcoming Ride
        </CardTitle>
        <CardDescription>Your next planned route</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Coastal Loop Ride</h3>
          <span className="text-sm text-muted-foreground">Tomorrow</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <Map className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-sm">45 km</span>
          </div>
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-sm">680 m</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-sm">~2h 15m</span>
          </div>
          <div className="flex items-center">
            <BarChart className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-sm">~950 kcal</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm border-t pt-4">
          <Droplet className="w-4 h-4 text-secondary" />
          <span>Hydration needed: 1.5L</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link to="/routes/upcoming">
          <Button variant="ghost" size="sm" className="gap-1">
            View route details <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
