
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Utensils, BarChart, Droplet, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function NutritionTabContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Nutrition Planning</h2>
        <Button className="gap-2">
          <Utensils className="h-4 w-4" />
          Create New Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-accent" />
              Macronutrient Breakdown
            </CardTitle>
            <CardDescription>Based on your recent rides</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                  <span>Carbohydrates (60%)</span>
                </div>
                <span className="font-medium">300g</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-accent mr-2"></div>
                  <span>Protein (25%)</span>
                </div>
                <span className="font-medium">125g</span>
              </div>
              <Progress value={25} className="h-2 bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-secondary mr-2"></div>
                  <span>Fat (15%)</span>
                </div>
                <span className="font-medium">75g</span>
              </div>
              <Progress value={15} className="h-2 bg-muted" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Droplet className="h-5 w-5 mr-2 text-secondary" />
              Hydration Planning
            </CardTitle>
            <CardDescription>Fluid requirements for your rides</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Daily Recommendation</p>
              <div className="flex items-center">
                <Droplet className="h-6 w-6 text-secondary mr-2" />
                <span className="text-2xl font-bold">2.5L</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">During Ride (per hour)</p>
              <div className="flex items-center">
                <Droplet className="h-6 w-6 text-secondary mr-2" />
                <span className="text-2xl font-bold">0.7L</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Additional Based on Temperature</p>
              <div className="flex items-center">
                <Droplet className="h-6 w-6 text-secondary mr-2" />
                <span className="text-2xl font-bold">+0.3L</span>
                <span className="text-sm text-muted-foreground ml-2">per hour above 25°C</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Recipes</CardTitle>
          <CardDescription>Based on your nutrition needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="h-40 bg-muted flex items-center justify-center">
                <Utensils className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="p-4">
                <h3 className="font-medium">High-Carb Energy Bowl</h3>
                <p className="text-sm text-muted-foreground mt-1">Perfect pre-ride meal with complex carbs</p>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">65g carbs</span>
                  <span className="px-2 py-1 bg-accent/10 text-accent rounded-md">15g protein</span>
                </div>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="h-40 bg-muted flex items-center justify-center">
                <Utensils className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="p-4">
                <h3 className="font-medium">Recovery Protein Smoothie</h3>
                <p className="text-sm text-muted-foreground mt-1">Optimal post-ride recovery drink</p>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">40g carbs</span>
                  <span className="px-2 py-1 bg-accent/10 text-accent rounded-md">30g protein</span>
                </div>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="h-40 bg-muted flex items-center justify-center">
                <Utensils className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="p-4">
                <h3 className="font-medium">On-Ride Energy Bars</h3>
                <p className="text-sm text-muted-foreground mt-1">Quick energy during long rides</p>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">30g carbs</span>
                  <span className="px-2 py-1 bg-accent/10 text-accent rounded-md">8g protein</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Link to="/nutrition/recipes">
            <Button variant="outline">View All Recipes</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
