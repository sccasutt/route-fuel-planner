
import React from "react";
import { SectionHeader } from "./SectionHeader";
import { RecentRoutesGrid } from "./RecentRoutesGrid";
import { RouteType } from "@/types/route";

interface RecentRoutesSectionProps {
  routes: RouteType[];
  routeCoordinates?: Record<string, [number, number][]>;
}

export function RecentRoutesSection({ routes, routeCoordinates = {} }: RecentRoutesSectionProps) {
  return (
    <div className="p-6 bg-muted rounded-lg border">
      <SectionHeader title="Recent Routes" linkTo="/routes" />
      <RecentRoutesGrid routes={routes} routeCoordinates={routeCoordinates} />
    </div>
  );
}
