
import { NutritionStatusCard } from "./NutritionStatusCard";
import { UpcomingRideCard } from "./UpcomingRideCard";
import { ActivityStatsCard } from "./ActivityStatsCard";
import { RecentRoutesSection } from "./RecentRoutesSection";
import { WahooConnectPrompt } from "./WahooConnectPrompt";

interface RouteType {
  id: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  calories: number;
}

interface OverviewTabContentProps {
  activities: RouteType[];
  setConnectionError: (error: string | null) => void;
}

export function OverviewTabContent({ activities, setConnectionError }: OverviewTabContentProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NutritionStatusCard />
        <UpcomingRideCard />
        <ActivityStatsCard activities={activities} />
      </div>
      
      {activities.length > 0 ? (
        <RecentRoutesSection routes={activities} />
      ) : (
        <WahooConnectPrompt setConnectionError={setConnectionError} />
      )}
    </div>
  );
}
