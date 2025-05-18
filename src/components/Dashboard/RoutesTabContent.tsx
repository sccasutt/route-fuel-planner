
import { Card } from "@/components/ui/card";
import { Bike, Map, TrendingUp, Clock, LineChart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWahooSyncHandler } from "@/hooks/wahoo/useWahooSyncHandler";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatDuration, ensureValidDuration } from "@/lib/utils";

interface RouteType {
  id: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  duration_seconds?: number | null;
  calories: number;
}

interface Props {
  routes: RouteType[];
}

export function RoutesTabContent({ routes }: Props) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth();
  const { syncWahooData } = useWahooSyncHandler();
  const { toast } = useToast();

  // Ensure routes have proper values
  const validatedRoutes = routes.map(route => {
    // Prefer numeric duration if available
    const displayDuration = route.duration_seconds && route.duration_seconds > 0
      ? secondsToTimeString(route.duration_seconds)
      : ensureValidDuration(route.duration);
    
    return {
      ...route,
      distance: typeof route.distance === 'number' && !isNaN(route.distance) ? route.distance : 0,
      elevation: typeof route.elevation === 'number' && !isNaN(route.elevation) ? route.elevation : 0,
      calories: typeof route.calories === 'number' && !isNaN(route.calories) ? route.calories : 0,
      duration: displayDuration,
      name: route.name || "Unnamed Route",
      date: route.date || new Date().toISOString().split('T')[0]
    };
  });

  const handleWahooImport = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to import your Wahoo routes",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    try {
      const wahooTokenString = localStorage.getItem("wahoo_token");
      if (!wahooTokenString) {
        throw new Error("No Wahoo connection found. Please connect your Wahoo account first.");
      }
      
      const token = JSON.parse(wahooTokenString);
      if (!token.access_token || !token.refresh_token) {
        throw new Error("Invalid Wahoo token. Please reconnect your Wahoo account.");
      }

      const result = await syncWahooData({
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: token.expires_at || 0,
        wahoo_user_id: token.wahoo_user_id
      });

      if (result.success) {
        toast({
          title: "Wahoo Import Complete",
          description: "Your routes have been successfully imported"
        });
        
        // Refresh the page or trigger data refetch
        window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw result.error;
      }
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import from Wahoo",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Routes</h2>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={handleWahooImport} 
            disabled={isSyncing}
          >
            <Bike className="h-4 w-4" />
            {isSyncing ? "Importing..." : "Import from Wahoo"}
          </Button>
          <Button className="gap-2">
            <Map className="h-4 w-4" />
            Plan New Route
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {validatedRoutes.length > 0 ? (
          validatedRoutes.map((route) => (
            <Card key={route.id} className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-4">
                <div className="bg-muted p-6 flex flex-col justify-center">
                  <h3 className="font-semibold text-lg">{route.name}</h3>
                  <p className="text-sm text-muted-foreground">{route.date}</p>
                </div>
                <div className="col-span-3 p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Map className="w-4 h-4 mr-1" />
                        <span>Distance</span>
                      </div>
                      <p className="font-semibold">{route.distance.toFixed(1)} km</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span>Elevation</span>
                      </div>
                      <p className="font-semibold">{route.elevation.toFixed(0)} m</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>Duration</span>
                      </div>
                      <p className="font-semibold">{formatDuration(route.duration)}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <LineChart className="w-4 h-4 mr-1" />
                        <span>Calories</span>
                      </div>
                      <p className="font-semibold">{route.calories} kcal</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Link to={`/routes/${route.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        View Details
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 border rounded-lg bg-muted/40">
            <p className="text-muted-foreground mb-2">No routes found</p>
            <p className="mb-4">Import your routes from Wahoo or create a new route</p>
          </div>
        )}
      </div>
    </div>
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
