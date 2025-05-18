
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Component to display the last API response from Wahoo
 * This is useful for debugging and development purposes
 */
export function WahooApiDebugger() {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("activities");
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    // Check for stored API responses in localStorage
    const storedActivities = localStorage.getItem("wahoo_last_activities_response");
    const storedProfile = localStorage.getItem("wahoo_last_profile_response");
    
    // Set initial API response based on active tab
    if (activeTab === "activities" && storedActivities) {
      try {
        setApiResponse(JSON.parse(storedActivities));
      } catch (err) {
        console.error("Failed to parse stored activities response:", err);
        setApiResponse(null);
      }
    } else if (activeTab === "profile" && storedProfile) {
      try {
        setApiResponse(JSON.parse(storedProfile));
      } catch (err) {
        console.error("Failed to parse stored profile response:", err);
        setApiResponse(null);
      }
    }
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const refreshData = () => {
    // Force a refresh of stored data
    const storedData = localStorage.getItem(
      activeTab === "activities" 
        ? "wahoo_last_activities_response" 
        : "wahoo_last_profile_response"
    );
    
    if (storedData) {
      try {
        setApiResponse(JSON.parse(storedData));
      } catch (err) {
        console.error("Failed to parse stored response:", err);
      }
    }
  };

  const renderDataDisplay = () => {
    if (!apiResponse) {
      return <p className="text-muted-foreground">No API response data found. Try syncing with Wahoo first.</p>;
    }

    if (showRaw) {
      return (
        <pre className="bg-muted p-4 rounded-md overflow-auto text-xs max-h-[400px]">
          {JSON.stringify(apiResponse, null, 2)}
        </pre>
      );
    }

    // Render formatted view
    return (
      <div className="space-y-4 max-h-[400px] overflow-auto">
        {activeTab === "activities" && Array.isArray(apiResponse) ? (
          apiResponse.slice(0, 3).map((activity: any, index: number) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">
                  {activity.name || `Activity ${index + 1}`}
                </CardTitle>
                <CardDescription className="text-xs">
                  {activity.date || "No date"}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="font-medium">ID:</span> {activity.id}</div>
                  <div><span className="font-medium">Distance:</span> {activity.distance}</div>
                  <div><span className="font-medium">Duration:</span> {activity.duration}</div>
                  <div><span className="font-medium">Calories:</span> {activity.calories}</div>
                  <div><span className="font-medium">Elevation:</span> {activity.elevation}</div>
                  {activity.type && <div><span className="font-medium">Type:</span> {activity.type}</div>}
                </div>
              </CardContent>
            </Card>
          ))
        ) : activeTab === "profile" ? (
          <div className="space-y-2 text-sm">
            {Object.entries(apiResponse).map(([key, value]: [string, any]) => (
              <div key={key} className="grid grid-cols-3 gap-4 border-b pb-2">
                <div className="font-medium">{key}</div>
                <div className="col-span-2 truncate">{
                  typeof value === 'object' 
                    ? JSON.stringify(value) 
                    : String(value)
                }</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Invalid or unexpected data format.</p>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Wahoo API Response Debugger</CardTitle>
        <CardDescription>
          View the latest responses from the Wahoo API
        </CardDescription>
        <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {renderDataDisplay()}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => setShowRaw(!showRaw)}>
          {showRaw ? "Show Formatted" : "Show Raw JSON"}
        </Button>
        <Button variant="default" size="sm" onClick={refreshData}>Refresh</Button>
      </CardFooter>
    </Card>
  );
}
