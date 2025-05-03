
import { Bike, Map, Clock, LineChart, Trophy, Calendar } from "lucide-react";
import { WahooActivityData } from "@/hooks/wahoo/wahooTypes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  isLoading: boolean;
  activities: WahooActivityData[];
}

export function WahooActivitySummaryCard({ isLoading, activities }: Props) {
  // Calculate summary statistics - ensure we're parsing numbers correctly
  const totalDistance = activities.reduce((sum, act) => {
    // Make sure distance is treated as a number
    const distance = typeof act.distance === 'number' 
      ? act.distance 
      : typeof act.distance === 'string'
        ? parseFloat(act.distance)
        : 0;
    return sum + distance;
  }, 0).toFixed(1);
  
  const totalCalories = activities.reduce((sum, act) => {
    // Make sure calories are treated as numbers
    const calories = typeof act.calories === 'number'
      ? act.calories
      : typeof act.calories === 'string'
        ? parseInt(act.calories, 10)
        : 0;
    return sum + calories;
  }, 0);
  
  // Debug logged data
  console.log("WahooActivitySummaryCard activities:", activities.slice(0, 2));
  console.log("Calculated total distance:", totalDistance);
  console.log("Calculated total calories:", totalCalories);
  
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm h-full">
      <div className="mb-4 font-semibold text-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bike className="h-5 w-5 text-primary" />
          <span>Wahoo Activity Summary</span>
        </div>
        {activities.length > 0 && (
          <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span>{activities.length} activities synced</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="flex justify-between mb-2">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[80px]" />
          </div>
          <Skeleton className="h-[120px] w-full" />
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-muted-foreground text-xs mb-1 flex items-center">
                <Map className="w-3 h-3 mr-1" /> Total Distance
              </div>
              <div className="text-xl font-semibold">{totalDistance} km</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-muted-foreground text-xs mb-1 flex items-center">
                <LineChart className="w-3 h-3 mr-1" /> Total Calories
              </div>
              <div className="text-xl font-semibold">{totalCalories}</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-muted-foreground text-xs mb-1 flex items-center">
                <Calendar className="w-3 h-3 mr-1" /> Last Activity
              </div>
              <div className="text-xl font-semibold">{activities[0]?.date || "N/A"}</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-muted-foreground text-xs mb-1 flex items-center">
                <Trophy className="w-3 h-3 mr-1" /> Activities
              </div>
              <div className="text-xl font-semibold">{activities.length}</div>
            </div>
          </div>

          <h3 className="text-sm font-semibold mb-2">Recent Activities</h3>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between border-b border-muted pb-2">
                <div>
                  <p className="font-medium text-sm">{activity.name}</p>
                  <p className="text-xs text-muted-foreground">{activity.date}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center text-xs">
                    <Map className="w-3 h-3 mr-1 text-muted-foreground" />
                    <span>{typeof activity.distance === 'number' ? activity.distance.toFixed(1) : parseFloat(String(activity.distance || 0)).toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                    <span>{activity.duration}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <LineChart className="w-3 h-3 mr-1 text-muted-foreground" />
                    <span>{activity.calories} kcal</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {activities.length > 5 && (
            <div className="text-center mt-2">
              <Button variant="ghost" size="sm">View all {activities.length} activities</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-2">No activities found</div>
          <p className="text-sm mb-4">Start riding with your Wahoo device and your activities will appear here!</p>
          <Button variant="outline" size="sm" className="gap-2">
            <Bike className="h-4 w-4" />
            Sync Activities
          </Button>
        </div>
      )}
    </div>
  );
}
