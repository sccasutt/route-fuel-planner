
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Bike, Wind } from "lucide-react";
import { RouteHeader } from "@/components/RouteDetail/RouteHeader";
import { RouteSummaryCards } from "@/components/RouteDetail/RouteSummaryCards";
import { RouteMapCard } from "@/components/RouteDetail/RouteMapCard";
import { ActivityDataCard } from "@/components/RouteDetail/ActivityDataCard";
import { NutritionTab } from "@/components/RouteDetail/NutritionTab";
import { NotesTab } from "@/components/RouteDetail/NotesTab";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const RouteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  useEffect(() => {
    const fetchRouteData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch the route data from the database
        const { data: route, error } = await supabase
          .from('routes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error("Error fetching route:", error);
          toast({ 
            title: "Error", 
            description: "Failed to load route data", 
            variant: "destructive" 
          });
          navigate('/dashboard');
          return;
        }

        if (!route) {
          toast({ 
            title: "Not Found", 
            description: "Route not found", 
            variant: "destructive" 
          });
          navigate('/dashboard');
          return;
        }

        setRouteData(route);
        
        // Parse GPS coordinates if available in gpx_data
        let coordinates: [number, number][] = [];
        
        if (route.gpx_data) {
          try {
            const parsedData = JSON.parse(route.gpx_data);
            if (parsedData.coordinates && Array.isArray(parsedData.coordinates)) {
              // Ensure each coordinate is a valid [lat, lng] tuple
              coordinates = parsedData.coordinates
                .filter((coord: any) => Array.isArray(coord) && coord.length === 2)
                .map((coord: number[]) => [coord[0], coord[1]] as [number, number]);
            }
          } catch (err) {
            console.warn("Failed to parse GPX data:", err);
          }
        }
        
        // If we couldn't get coordinates, use a default set based on London
        if (coordinates.length < 2) {
          // Default circular route around a central point
          const center: [number, number] = [51.505, -0.09];
          coordinates = generateSimpleRouteAround(center, 0.03);
        }
        
        setRouteCoordinates(coordinates);
      } catch (err) {
        console.error("Error in route data fetch:", err);
        toast({ 
          title: "Error", 
          description: "An unexpected error occurred", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRouteData();
  }, [id, navigate, toast]);

  // Generate a simple circular route around a center point
  const generateSimpleRouteAround = (center: [number, number], radius: number): [number, number][] => {
    const points: [number, number][] = [];
    const steps = 12;
    
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const lat = center[0] + Math.sin(angle) * radius;
      const lng = center[1] + Math.cos(angle) * radius;
      points.push([lat, lng]);
    }
    
    return points;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading route data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!routeData) {
    return (
      <Layout>
        <div className="container py-8">
          <h1 className="text-2xl font-bold mb-4">Route not found</h1>
          <p>The requested route could not be found.</p>
        </div>
      </Layout>
    );
  }

  // Define the nutrition items for the NutritionTab
  const nutritionItems = [
    {
      name: "Carbohydrates",
      value: 120,
      unit: "g",
      percentage: 60,
      color: "primary",
      description: "Primary energy source for high-intensity cycling"
    },
    {
      name: "Protein",
      value: 25,
      unit: "g",
      percentage: 15,
      color: "accent",
      description: "Essential for muscle recovery after your ride"
    },
    {
      name: "Fat",
      value: 15,
      unit: "g",
      percentage: 25,
      color: "secondary",
      description: "Secondary energy source for longer rides"
    },
    {
      name: "Hydration",
      value: 1.5,
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
      value: `${routeData.calories || 0} kcal`,
      icon: LineChart
    },
    {
      label: "Avg Speed",
      value: routeData.distance && routeData.duration_seconds ? 
        `${((routeData.distance / (routeData.duration_seconds / 3600))).toFixed(1)} km/h` : 
        "N/A",
      icon: Bike
    },
    {
      label: "Max Speed",
      value: routeData.max_speed ? `${routeData.max_speed} km/h` : "N/A",
      icon: Bike
    }
  ];

  // Define weather items for ActivityDataCard - these would ideally come from a weather API
  const weatherItems = [
    {
      label: "Temperature",
      value: `18°C`,
      icon: LineChart
    },
    {
      label: "Wind Speed",
      value: `12 km/h`,
      icon: Wind
    },
    {
      label: "Wind Direction",
      value: "NE",
      icon: Wind
    }
  ];

  // Get center coordinates for the map from the route data
  // Fix: Ensure we have a valid tuple with exactly 2 elements for the map center
  const mapCenter: [number, number] = routeCoordinates.length > 0 
    ? [routeCoordinates[0][0], routeCoordinates[0][1]] 
    : [51.505, -0.09];

  return (
    <Layout>
      <div className="container py-8">
        <RouteHeader name={routeData.name} date={routeData.date} />
        
        <RouteSummaryCards 
          distance={routeData.distance || 0} 
          elevation={routeData.elevation || 0} 
          duration={routeData.duration || "0:00:00"} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <RouteMapCard 
              coordinates={mapCenter} 
              routeCoordinates={routeCoordinates} 
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
