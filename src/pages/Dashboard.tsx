
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWahooData, WahooActivityData } from "@/hooks/useWahooData";
import { ConnectedAccountsCard } from "@/components/Dashboard/ConnectedAccountsCard";
import { RecentActivityCard } from "@/components/Dashboard/RecentActivityCard";
import { NutritionStatusCard } from "@/components/Dashboard/NutritionStatusCard";
import { UpcomingRideCard } from "@/components/Dashboard/UpcomingRideCard";
import { RecentRoutesSection } from "@/components/Dashboard/RecentRoutesSection";
import { RoutesTabContent } from "@/components/Dashboard/RoutesTabContent";
import { NutritionTabContent } from "@/components/Dashboard/NutritionTabContent";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RefreshCcw, AlertCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WahooResyncButton } from "@/components/Wahoo/WahooResyncButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define a type that matches what RecentRoutesSection and RoutesTabContent expect
interface RouteType {
  id: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  duration: string;
  calories: number;
}

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { isConnected, activities, isLoading, refresh, syncStatus } = useWahooData();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [syncComplete, setSyncComplete] = useState(false);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Handle manual refresh
  const handleRefresh = () => {
    refresh();
    setSyncComplete(false);
    toast({
      title: "Refreshing data",
      description: "Fetching your latest activity data..."
    });
    
    // Show success message after refresh
    setTimeout(() => {
      setSyncComplete(true);
      setTimeout(() => setSyncComplete(false), 3000);
    }, 1500);
  };

  // Convert WahooActivityData to RouteType (since they're compatible)
  const routesData: RouteType[] = activities.map(activity => ({
    ...activity,
    id: activity.id
  }));

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>

        {connectionError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}

        {syncComplete && (
          <Alert variant="default" className="mb-6 bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-500" />
            <AlertTitle>Sync Complete</AlertTitle>
            <AlertDescription>Your Wahoo data has been refreshed.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <ConnectedAccountsCard />
          </div>
          <div className="col-span-2">
            <RecentActivityCard activities={activities} isLoading={isLoading} />
          </div>
        </div>

        <Tabs defaultValue="overview" onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid grid-cols-3 md:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <NutritionStatusCard />
              <UpcomingRideCard />
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Activity Stats</h3>
                {activities.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="text-muted-foreground text-xs mb-1">Total Distance</div>
                        <div className="text-xl font-semibold">
                          {activities.reduce((sum, act) => sum + (typeof act.distance === 'number' ? act.distance : 0), 0).toFixed(1)} km
                        </div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="text-muted-foreground text-xs mb-1">Total Activities</div>
                        <div className="text-xl font-semibold">{activities.length}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No activity data yet</p>
                  </div>
                )}
              </div>
            </div>
            {activities.length > 0 ? (
              <RecentRoutesSection routes={routesData} />
            ) : (
              <div className="p-6 bg-muted rounded-lg border text-center">
                <h2 className="text-xl font-bold mb-2">Connect Your Wahoo Account</h2>
                <p className="text-muted-foreground mb-4">
                  Connect your Wahoo account to see your routes and activities
                </p>
                <WahooResyncButton 
                  setConnectionError={setConnectionError}
                  variant="default"
                  size="default"
                  label="Connect Wahoo"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="routes">
            <RoutesTabContent routes={routesData} />
          </TabsContent>

          <TabsContent value="nutrition">
            <NutritionTabContent />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;
