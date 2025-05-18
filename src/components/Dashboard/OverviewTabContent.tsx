import { NutritionStatusCard } from "./NutritionStatusCard";
import { UpcomingRideCard } from "./UpcomingRideCard";
import { ActivityStatsCard } from "./ActivityStatsCard";
import { RecentRoutesSection } from "./RecentRoutesSection";
import { WahooConnectPrompt } from "./WahooConnectPrompt";
import { RouteType } from "@/types/route";

interface OverviewTabContentProps {
  activities: RouteType[];
  setConnectionError: (error: string | null) => void;
  routeCoordinates?: Record<string, [number, number][]>;
}

export function OverviewTabContent({ 
  activities, 
  setConnectionError, 
  routeCoordinates = {} 
}: OverviewTabContentProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NutritionStatusCard />
        <UpcomingRideCard />
        <ActivityStatsCard activities={activities} />
      </div>
      
      {activities.length > 0 ? (
        <RecentRoutesSection 
          routes={activities} 
          routeCoordinates={routeCoordinates} 
        />
      ) : (
        <WahooConnectPrompt setConnectionError={setConnectionError} />
      )}
    </div>
  );
}
