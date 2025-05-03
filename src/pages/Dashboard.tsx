
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWahooData } from "@/hooks/useWahooData";
import { ConnectedAccountsCard } from "@/components/Dashboard/ConnectedAccountsCard";
import { WahooActivitySummaryCard } from "@/components/Dashboard/WahooActivitySummaryCard";
import { RecentActivityCard } from "@/components/Dashboard/RecentActivityCard";
import { NutritionStatusCard } from "@/components/Dashboard/NutritionStatusCard";
import { UpcomingRideCard } from "@/components/Dashboard/UpcomingRideCard";
import { RecentRoutesSection } from "@/components/Dashboard/RecentRoutesSection";
import { RoutesTabContent } from "@/components/Dashboard/RoutesTabContent";
import { NutritionTabContent } from "@/components/Dashboard/NutritionTabContent";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { isConnected, activities, isLoading, refresh } = useWahooData();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Handle manual refresh
  const handleRefresh = () => {
    refresh();
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          {isConnected && (
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Refresh Data
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <ConnectedAccountsCard />
          </div>
          {isConnected && (
            <div className="col-span-2">
              <WahooActivitySummaryCard isLoading={isLoading} activities={activities} />
            </div>
          )}
        </div>

        <Tabs defaultValue="overview" onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid grid-cols-3 md:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <RecentActivityCard />
              <NutritionStatusCard />
              <UpcomingRideCard />
            </div>
            {activities.length > 0 ? (
              <RecentRoutesSection routes={activities} />
            ) : (
              <div className="p-6 bg-muted rounded-lg border text-center">
                <h2 className="text-xl font-bold mb-2">No Routes Yet</h2>
                <p className="text-muted-foreground mb-4">
                  Connect your Wahoo account to see your routes here
                </p>
                {!isConnected && (
                  <Button onClick={() => document.querySelector('.wahoo-connect-button')?.click()}>
                    Connect Wahoo
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="routes">
            <RoutesTabContent routes={activities} />
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
