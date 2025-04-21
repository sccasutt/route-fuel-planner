
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Utensils, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function NutritionStatusCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Utensils className="w-5 h-5 mr-2 text-accent" />
          Nutrition Status
        </CardTitle>
        <CardDescription>Your current nutrition stats</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Carbs</span>
            <span>240g / 300g</span>
          </div>
          <Progress value={80} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Protein</span>
            <span>90g / 120g</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Fat</span>
            <span>60g / 80g</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Hydration</span>
            <span>1.8L / 2.5L</span>
          </div>
          <Progress value={72} className="h-2" />
        </div>
      </CardContent>
      <CardFooter>
        <Link to="/nutrition">
          <Button variant="ghost" size="sm" className="gap-1">
            View nutrition plan <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
