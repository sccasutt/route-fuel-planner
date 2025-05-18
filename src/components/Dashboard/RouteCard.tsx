
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RouteStats } from "./RouteStats";
import { RouteMapPreview } from "./RouteMapPreview";

interface RouteCardProps {
  id: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  calories: number;
  routeCoordinates: [number, number][];
}

export function RouteCard({
  id,
  name,
  date,
  distance,
  elevation,
  duration,
  calories,
  routeCoordinates
}: RouteCardProps) {
  const hasValidCoordinates = routeCoordinates?.length >= 2;
  
  return (
    <Card key={id} className="overflow-hidden">
      <div className="h-2 bg-primary" />
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription>{date}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <RouteMapPreview 
          routeCoordinates={routeCoordinates}
          hasValidCoordinates={hasValidCoordinates}
        />
        <RouteStats 
          distance={distance}
          elevation={elevation}
          duration={duration}
          calories={calories}
        />
      </CardContent>
      <CardFooter>
        <Link to={`/routes/${id}`}>
          <Button variant="ghost" size="sm">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
