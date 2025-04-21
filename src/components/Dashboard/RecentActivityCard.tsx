
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Route, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function RecentActivityCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Route className="w-5 h-5 mr-2 text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your latest cycling stats</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Distance</p>
            <p className="text-2xl font-bold">112 km</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Rides</p>
            <p className="text-2xl font-bold">3</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Calories</p>
            <p className="text-2xl font-bold">2,670</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Elevation</p>
            <p className="text-2xl font-bold">1,295m</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link to="/routes">
          <Button variant="ghost" size="sm" className="gap-1">
            View all activity <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
