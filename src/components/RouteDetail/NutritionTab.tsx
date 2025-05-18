
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, Droplet } from "lucide-react";

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

interface NutritionTabProps {
  nutritionItems: NutritionItem[];
  recipes: RecipeItem[];
}

export function NutritionTab({ nutritionItems, recipes }: NutritionTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Utensils className="h-5 w-5 mr-2 text-accent" />
          Nutrition Requirements
        </CardTitle>
        <CardDescription>
          Personalized nutrition plan based on this route's data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {nutritionItems.map((item, index) => (
            <div key={index} className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{item.name}</h3>
                <div className={`px-2 py-1 bg-${item.color}/10 text-${item.color} rounded-full text-sm`}>
                  {item.percentage}%
                </div>
              </div>
              {item.name === "Hydration" ? (
                <div className="flex items-center">
                  <Droplet className="h-6 w-6 text-secondary mr-2" />
                  <p className="text-2xl font-bold">{item.value}{item.unit}</p>
                </div>
              ) : (
                <p className="text-2xl font-bold">{item.value}{item.unit}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-4">Recommended Recipes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recipes.map((recipe, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className="h-40 bg-muted flex items-center justify-center">
                  <Utensils className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="p-4">
                  <h3 className="font-medium">{recipe.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{recipe.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    {recipe.macros.map((macro, macroIndex) => (
                      <span key={macroIndex} className={`px-2 py-1 bg-${macro.color}/10 text-${macro.color} rounded-md`}>
                        {macro.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button className="gap-2">
            <Utensils className="h-4 w-4" />
            Get Personalized Recipe Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
