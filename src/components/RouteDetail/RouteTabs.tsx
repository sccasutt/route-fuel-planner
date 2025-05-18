
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NutritionTab } from "@/components/RouteDetail/NutritionTab";
import { NotesTab } from "@/components/RouteDetail/NotesTab";

interface NutritionItem {
  name: string;
  value: number;
  unit: string;
  percentage: number;
  color: string;
  description: string;
}

interface RecipeItem {
  name: string;
  description: string;
  macros: Array<{
    name: string;
    value: string;
    color: string;
  }>;
}

export function RouteTabs() {
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

  return (
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
  );
}
