
import { useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Bike, Wind } from "lucide-react";
import { RouteHeader } from "@/components/RouteDetail/RouteHeader";
import { RouteSummaryCards } from "@/components/RouteDetail/RouteSummaryCards";
import { RouteMapCard } from "@/components/RouteDetail/RouteMapCard";
import { ActivityDataCard } from "@/components/RouteDetail/ActivityDataCard";
import { NutritionTab } from "@/components/RouteDetail/NutritionTab";
import { NotesTab } from "@/components/RouteDetail/NotesTab";

// Sample route data (would come from an API in a real app)
const sampleRoute = {
  id: 1,
  name: "Morning Hill Climb",
  date: "2023-04-15",
  distance: 28.5,
  elevation: 450,
  duration: "1h 24m",
  calories: 680,
  avgSpeed: 20.4,
  maxSpeed: 42.8,
  temperature: 18,
  windSpeed: 12,
  windDirection: "NE",
  nutrition: {
    carbs: 120,
    protein: 25,
    fat: 15,
    water: 1.5
  },
  // Sample coordinates for the route (would come from API)
  coordinates: [51.505, -0.09],
  // Sample route coordinates - in a real app, these would come from the route data
  routeCoordinates: [
    [51.505, -0.09],
    [51.51, -0.1],
    [51.52, -0.12],
    [51.518, -0.14],
    [51.51, -0.15],
    [51.5, -0.14],
    [51.495, -0.12],
    [51.505, -0.09],
  ]
};

const RouteDetail = () => {
  const { id } = useParams();
  // In a real app, fetch route by ID here
  const route = sampleRoute;

  // Define the nutrition items for the NutritionTab
  const nutritionItems = [
    {
      name: "Carbohydrates",
      value: route.nutrition.carbs,
      unit: "g",
      percentage: 60,
      color: "primary",
      description: "Primary energy source for high-intensity cycling"
    },
    {
      name: "Protein",
      value: route.nutrition.protein,
      unit: "g",
      percentage: 15,
      color: "accent",
      description: "Essential for muscle recovery after your ride"
    },
    {
      name: "Fat",
      value: route.nutrition.fat,
      unit: "g",
      percentage: 25,
      color: "secondary",
      description: "Secondary energy source for longer rides"
    },
    {
      name: "Hydration",
      value: route.nutrition.water,
      unit: "L",
      percentage: 0,
      color: "secondary",
      description: "Recommended fluid intake for your ride"
    }
  ];

  // Define recipes for the NutritionTab
  const recipes = [
    {
      name: "Energizing Oatmeal Bowl",
      description: "Perfect pre-ride breakfast",
      macros: [
        { name: "carbs", value: "60g carbs", color: "primary" },
        { name: "protein", value: "15g protein", color: "accent" }
      ]
    },
    {
      name: "Trail Mix Energy Bars",
      description: "For during your ride",
      macros: [
        { name: "carbs", value: "35g carbs", color: "primary" },
        { name: "protein", value: "8g protein", color: "accent" }
      ]
    },
    {
      name: "Recovery Smoothie",
      description: "Post-ride recovery drink",
      macros: [
        { name: "carbs", value: "45g carbs", color: "primary" },
        { name: "protein", value: "25g protein", color: "accent" }
      ]
    }
  ];

  // Define energy & power items for ActivityDataCard
  const energyPowerItems = [
    {
      label: "Calories",
      value: `${route.calories} kcal`,
      icon: LineChart
    },
    {
      label: "Avg Speed",
      value: `${route.avgSpeed} km/h`,
      icon: Bike
    },
    {
      label: "Max Speed",
      value: `${route.maxSpeed} km/h`,
      icon: Bike
    }
  ];

  // Define weather items for ActivityDataCard
  const weatherItems = [
    {
      label: "Temperature",
      value: `${route.temperature}°C`,
      icon: LineChart
    },
    {
      label: "Wind Speed",
      value: `${route.windSpeed} km/h`,
      icon: Wind
    },
    {
      label: "Wind Direction",
      value: route.windDirection,
      icon: Wind
    }
  ];

  return (
    <Layout>
      <div className="container py-8">
        <RouteHeader name={route.name} date={route.date} />
        
        <RouteSummaryCards 
          distance={route.distance} 
          elevation={route.elevation} 
          duration={route.duration} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <RouteMapCard 
              coordinates={route.coordinates as [number, number]} 
              routeCoordinates={route.routeCoordinates as [number, number][]} 
            />
          </div>

          <div className="space-y-6">
            <ActivityDataCard 
              title="Energy & Power" 
              items={energyPowerItems} 
            />
            <ActivityDataCard 
              title="Weather Conditions" 
              items={weatherItems} 
            />
          </div>
        </div>

        <Tabs defaultValue="nutrition" className="mt-8">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="nutrition">Nutrition Plan</TabsTrigger>
            <TabsTrigger value="notes">Notes & Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="nutrition" className="space-y-6 mt-6">
            <NutritionTab 
              nutritionItems={nutritionItems} 
              recipes={recipes} 
            />
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-6">
            <NotesTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RouteDetail;
