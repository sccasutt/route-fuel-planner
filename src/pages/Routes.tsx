
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useWahooData } from "@/hooks/useWahooData";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { RoutesTabContent } from "@/components/Dashboard/RoutesTabContent";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const RoutesPage = () => {
  const { isConnected, activities, isLoading, refresh } = useWahooData();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    refresh();
    
    toast({
      title: "Refreshing data",
      description: "Fetching your latest routes..."
    });
    
    // Show success message after refresh and reset UI state
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  // Convert WahooActivityData to RouteType (since they're compatible)
  const routesData = activities.map(activity => ({
    ...activity,
    id: activity.id
  }));

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Routes</h1>
            <p className="text-muted-foreground">
              View and manage all your cycling routes
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your routes...</p>
            </div>
          ) : (
            <RoutesTabContent activities={routesData} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RoutesPage;
