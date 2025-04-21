
import { useState } from "react";
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

const sampleRoutes = [
  {
    id: 1,
    name: "Morning Hill Climb",
    date: "2023-04-15",
    distance: 28.5,
    elevation: 450,
    duration: "1h 24m",
    calories: 680,
  },
  {
    id: 2,
    name: "Weekend Long Ride",
    date: "2023-04-10",
    distance: 65.2,
    elevation: 725,
    duration: "3h 10m",
    calories: 1580,
  },
  {
    id: 3,
    name: "Recovery Flat Loop",
    date: "2023-04-08",
    distance: 18.3,
    elevation: 120,
    duration: "0h 52m",
    calories: 410,
  },
];

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { isConnected, activities, isLoading } = useWahooData();

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>

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
            <RecentRoutesSection routes={sampleRoutes} />
          </TabsContent>

          <TabsContent value="routes">
            <RoutesTabContent routes={sampleRoutes} />
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
