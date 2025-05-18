
import { Card } from "@/components/ui/card";
import { Map, Clock, LineChart, Activity } from "lucide-react";
import { WahooActivityData } from "@/hooks/useWahooData";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, formatShortDate, ensureValidDuration } from "@/lib/utils";

interface Props {
  activities: WahooActivityData[];
  isLoading: boolean;
}

export function RecentActivityCard({ activities, isLoading }: Props) {
  return (
    <Card className="overflow-hidden h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Recent Activity</h3>
          </div>
          {activities.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {activities.length} activities
            </span>
          )}
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[60px] w-full" />
            <Skeleton className="h-[60px] w-full" />
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {activities.slice(0, 3).map((activity) => {
              // Prefer duration_seconds if available
              const displayDuration = activity.duration_seconds && activity.duration_seconds > 0
                ? secondsToTimeString(activity.duration_seconds)
                : ensureValidDuration(activity.duration);
              
              return (
                <div key={activity.id} className="flex items-center justify-between border-b border-muted pb-2">
                  <div>
                    <p className="font-medium text-sm">{activity.name}</p>
                    <p className="text-xs text-muted-foreground">{formatShortDate(activity.date)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center text-xs">
                      <Map className="w-3 h-3 mr-1 text-muted-foreground" />
                      <span>{activity.distance.toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                      <span>{displayDuration}</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <LineChart className="w-3 h-3 mr-1 text-muted-foreground" />
                      <span>{activity.calories} kcal</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-2">No recent activities</p>
            <p className="text-sm">Connect your Wahoo device to see activities</p>
          </div>
        )}
      </div>
    </Card>
  );
}

// Helper function to convert seconds to HH:MM:SS format
function secondsToTimeString(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:01:00"; // Default to 1 minute if no valid value
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
