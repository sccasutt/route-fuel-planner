
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWahooData } from "@/hooks/useWahooData";
import { ConnectedAccountsCard } from "@/components/Dashboard/ConnectedAccountsCard";
import { RecentActivityCard } from "@/components/Dashboard/RecentActivityCard";
import { RoutesTabContent } from "@/components/Dashboard/RoutesTabContent";
import { NutritionTabContent } from "@/components/Dashboard/NutritionTabContent";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/Dashboard/DashboardHeader";
import { ConnectionAlerts } from "@/components/Dashboard/ConnectionAlerts";
import { OverviewTabContent } from "@/components/Dashboard/OverviewTabContent";

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { isConnected, activities, isLoading, refresh } = useWahooData();
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
  const routesData = activities.map(activity => ({
    ...activity,
    id: activity.id
  }));

  // Generate route coordinates map for passing to components
  const routeCoordinatesMap = Object.fromEntries(
    activities.map(activity => {
      // Try to extract coordinates from activity
      let coordinates: [number, number][] = [];
      if (activity.coordinates && Array.isArray(activity.coordinates) && activity.coordinates.length >= 2) {
        coordinates = activity.coordinates as [number, number][];
      } else {
        // Fallback coordinates if none in the activity
        coordinates = [
          [51.505, -0.09],
          [51.51, -0.1],
          [51.52, -0.12],
          [51.518, -0.14],
          [51.51, -0.15],
          [51.5, -0.14],
          [51.495, -0.12],
          [51.505, -0.09]
        ];
      }
      return [activity.id, coordinates];
    })
  );

  return (
    <Layout>
      <div className="container py-8">
        <DashboardHeader onRefresh={handleRefresh} isLoading={isLoading} />

        <ConnectionAlerts 
          connectionError={connectionError} 
          syncComplete={syncComplete} 
        />

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

          <TabsContent value="overview">
            <OverviewTabContent 
              activities={routesData} 
              setConnectionError={setConnectionError} 
              routeCoordinates={routeCoordinatesMap}
            />
          </TabsContent>

          <TabsContent value="routes">
            <RoutesTabContent activities={routesData} routeCoordinatesMap={routeCoordinatesMap} />
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
