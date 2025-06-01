
import React from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RouteMap from "@/components/Map/RouteMap";

interface FeaturedRouteMapProps {
  route: {
    id: string;
    name: string;
    date: string;
  } | null;
  routeCoordinates?: [number, number][];
}

export function FeaturedRouteMap({ route, routeCoordinates = [] }: FeaturedRouteMapProps) {
  if (!route) {
    return null;
  }

  const hasValidCoordinates = routeCoordinates.length >= 2;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recent Route</CardTitle>
        <CardDescription>
          {route.name} - {new Date(route.date).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[300px] w-full relative">
          {hasValidCoordinates ? (
            <>
              <RouteMap 
                center={[
                  routeCoordinates.reduce((sum, coord) => sum + coord[0], 0) / routeCoordinates.length,
                  routeCoordinates.reduce((sum, coord) => sum + coord[1], 0) / routeCoordinates.length
                ]}
                routeCoordinates={routeCoordinates}
                height="300px"
                zoom={12}
                className="rounded-b-lg"
                mapStyle="terrain"
              />
              <div className="absolute bottom-4 right-4">
                <Link to={`/routes/${route.id}`}>
                  <Button size="sm" className="gap-2">
                    <MapPin className="h-4 w-4" /> View Details <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="h-full bg-muted flex flex-col items-center justify-center">
              <p className="text-muted-foreground mb-4">No route data available</p>
              <div className="absolute bottom-4 right-4">
                <Link to={`/routes/${route.id}`}>
                  <Button size="sm" className="gap-2">
                    <MapPin className="h-4 w-4" /> View Details <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
