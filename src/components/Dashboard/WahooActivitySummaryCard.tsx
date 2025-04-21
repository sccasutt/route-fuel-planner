
import { Bike, Map, Clock, LineChart } from "lucide-react";
import { WahooActivityData } from "@/hooks/useWahooData";

interface Props {
  isLoading: boolean;
  activities: WahooActivityData[];
}

export function WahooActivitySummaryCard({ isLoading, activities }: Props) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm h-full">
      <div className="mb-2 font-semibold text-lg flex items-center gap-2">
        <Bike className="h-5 w-5 text-primary" />
        Wahoo Activity Summary
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading Wahoo data...</p>
      ) : activities.length > 0 ? (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm mb-2">
            Your last {activities.length} activities synced from Wahoo
          </p>
          <div className="grid grid-cols-1 gap-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{activity.name}</p>
                  <p className="text-sm text-muted-foreground">{activity.date}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center text-sm">
                    <Map className="w-3 h-3 mr-1 text-muted-foreground" />
                    <span>{activity.distance} km</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                    <span>{activity.duration}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <LineChart className="w-3 h-3 mr-1 text-muted-foreground" />
                    <span>{activity.calories} kcal</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">No activities found. Start riding and your data will appear here!</p>
      )}
    </div>
  );
}
