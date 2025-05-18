
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
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { isConnected, activities, isLoading, refresh } = useWahooData();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [syncComplete, setSyncComplete] = useState(false);
  const [renderAttempt, setRenderAttempt] = useState(0);

  // Debug logging
  useEffect(() => {
    // Log current state
    console.log("Dashboard rendered with:", {
      user: user?.id || "No user",
      loading,
      activitiesLoaded: activities?.length || 0,
      isWahooLoading: isLoading,
      renderAttempt,
      currentPath: window.location.pathname,
      dashboardVisible: document.getElementById('dashboard-container') ? true : false,
      documentReadyState: document.readyState
    });
    
    // Check for viewable content
    const checkVisibleContent = () => {
      const dashboardContainer = document.getElementById('dashboard-container');
      if (dashboardContainer) {
        console.log("Dashboard container visible stats:", {
          isVisible: dashboardContainer.offsetParent !== null,
          width: dashboardContainer.offsetWidth,
          height: dashboardContainer.offsetHeight,
          childNodes: dashboardContainer.childNodes.length,
          computedStyle: window.getComputedStyle(dashboardContainer),
          zIndex: window.getComputedStyle(dashboardContainer).zIndex
        });
      } else {
        console.log("Dashboard container not found in DOM");
      }
      
      // Check for any overlays that might be blocking the view
      const overlays = document.querySelectorAll('[class*="fixed inset-0"]');
      if (overlays.length > 0) {
        console.log("Potential overlay elements found:", overlays.length);
        overlays.forEach((overlay, i) => {
          console.log(`Overlay ${i}:`, {
            classes: overlay.className,
            visibility: window.getComputedStyle(overlay).visibility,
            display: window.getComputedStyle(overlay).display,
            zIndex: window.getComputedStyle(overlay).zIndex
          });
        });
      }
    };
    
    // Run visual check after DOM update
    setTimeout(checkVisibleContent, 500);
    
    // Try re-rendering a few times if needed
    if (!user && !loading && renderAttempt < 3) {
      setTimeout(() => setRenderAttempt(prev => prev + 1), 1000);
    }
  }, [user, loading, activities, isLoading, renderAttempt]);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log("No authenticated user, redirecting to auth page");
        navigate("/auth");
      } else {
        console.log("User authenticated, continuing to dashboard");
      }
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

  // If still loading or no user, show minimal content
  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="text-center py-24">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="text-center py-24">
            <p className="text-lg">Please log in to access your dashboard</p>
            <Button 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground"
              onClick={() => navigate("/auth")}
            >
              Go to login page
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

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
      <div id="dashboard-container" className="container py-8" style={{ position: 'relative', zIndex: 1 }}>
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
            <RoutesTabContent activities={routesData} routeCoordinatesMap={routeCoordinatesMap} isLoading={isLoading} />
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
