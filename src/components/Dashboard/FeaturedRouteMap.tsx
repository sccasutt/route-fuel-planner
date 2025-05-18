
import React from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RouteMap from "../Map/RouteMap";

interface FeaturedRouteMapProps {
  route: {
    id: string;
    name: string;
    date: string;
  } | null;
  routeCoordinates: [number, number][];
}

export function FeaturedRouteMap({ route, routeCoordinates }: FeaturedRouteMapProps) {
  if (!route || routeCoordinates.length < 2) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-primary" />
          Latest Route Map
        </CardTitle>
        <CardDescription>{route.name} - {route.date}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[240px] w-full">
          <RouteMap
            center={routeCoordinates[0]}
            zoom={12}
            height="100%"
            className="rounded-none"
            showControls={true}
            routeCoordinates={routeCoordinates}
            mapStyle="default"
            routeStyle={{
              color: "#0EA5E9", // Ocean blue
              weight: 4,
              opacity: 0.8
            }}
          />
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50">
        <Link to={`/routes/${route.id}`}>
          <Button variant="outline" size="sm">View Full Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
