import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatHumanReadableDuration } from "@/lib/durationFormatter";

interface ActivityStatsProps {
  activities: Array<{
    id: string;
    name: string;
    date: string;
    distance: number;
    elevation: number;
    duration: string;
    duration_seconds?: number | null;
    calories: number;
  }>;
}

export function ActivityStatsCard({ activities }: ActivityStatsProps) {
  // Calculate total stats
  const totalDistance = activities.reduce((sum, act) => sum + (typeof act.distance === 'number' ? act.distance : 0), 0);
  const totalElevation = activities.reduce((sum, act) => sum + (typeof act.elevation === 'number' ? act.elevation : 0), 0);
  
  // Calculate average duration using duration_seconds if available
  let averageDurationInSeconds = 0;
  if (activities.length > 0) {
    const totalSeconds = activities.reduce((sum, act) => {
      // Prefer duration_seconds if available
      if (act.duration_seconds && typeof act.duration_seconds === 'number') {
        return sum + act.duration_seconds;
      }
      
      // Fall back to parsing duration string
      return sum + (typeof act.duration === 'string' ? 
        parseDurationToSeconds(act.duration || "0:00:00") : 0);
    }, 0);
    
    averageDurationInSeconds = Math.round(totalSeconds / activities.length);
  }
  
  // Helper function to parse duration string to seconds
  function parseDurationToSeconds(durationString: string): number {
    if (!durationString) return 0;
    
    // If it's already a number as string, parse it directly
    if (!isNaN(Number(durationString))) {
      return parseInt(durationString, 10);
    }
    
    const parts = durationString.split(':');
    
    if (parts.length === 3) {
      // HH:MM:SS format
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      const seconds = parseInt(parts[2], 10) || 0;
      
      return hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
      // MM:SS format
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1], 10) || 0;
      
      return minutes * 60 + seconds;
    }
    
    return 0;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Activity Stats</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-muted-foreground text-xs mb-1">Total Distance</div>
                <div className="text-xl font-semibold">
                  {(totalDistance/1000).toFixed(1)} km
                </div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-muted-foreground text-xs mb-1">Total Activities</div>
                <div className="text-xl font-semibold">{activities.length}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-muted-foreground text-xs mb-1">Total Elevation</div>
                <div className="text-xl font-semibold">
                  {Math.round(totalElevation)} m
                </div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-muted-foreground text-xs mb-1">Average Duration</div>
                <div className="text-xl font-semibold">
                  {formatHumanReadableDuration(averageDurationInSeconds)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No activity data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
