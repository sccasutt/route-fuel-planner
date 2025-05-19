
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Layers, Flame, Wind } from "lucide-react";
import { getWindImpactSummary } from "@/utils/weatherUtils";

interface MacronutrientCardProps {
  caloriesPowerBased?: number | null;
  caloriesEstimated?: number | null;
  fatGrams?: number | null;
  carbGrams?: number | null;
  proteinGrams?: number | null;
  weatherJson?: any;
}

export function MacronutrientCard({
  caloriesPowerBased,
  caloriesEstimated,
  fatGrams = 0,
  carbGrams = 0,
  proteinGrams = 0,
  weatherJson
}: MacronutrientCardProps) {
  // Use power-based calories if available, otherwise use estimated
  const calories = caloriesPowerBased || caloriesEstimated || 0;
  
  // Calculate total macronutrients
  const totalGrams = (fatGrams || 0) + (carbGrams || 0) + (proteinGrams || 0);
  
  // Calculate percentages for progress bars
  const fatPercentage = totalGrams > 0 ? ((fatGrams || 0) / totalGrams) * 100 : 0;
  const carbPercentage = totalGrams > 0 ? ((carbGrams || 0) / totalGrams) * 100 : 0;
  const proteinPercentage = totalGrams > 0 ? ((proteinGrams || 0) / totalGrams) * 100 : 0;
  
  // Get wind impact summary if available
  const windImpact = weatherJson ? getWindImpactSummary(weatherJson) : "Unknown";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center">
          <Flame className="w-5 h-5 mr-2 text-primary" />
          Energy & Nutrition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calories Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Calories Burned</span>
            <span className="text-lg font-bold">{Math.round(calories)} kcal</span>
          </div>
          {caloriesPowerBased && caloriesEstimated && (
            <div className="text-xs text-muted-foreground">
              Power-based: {Math.round(caloriesPowerBased)} kcal | 
              Estimated: {Math.round(caloriesEstimated)} kcal
            </div>
          )}
        </div>
        
        {/* Macronutrients Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Macronutrient Requirements</h4>
          
          {/* Carbohydrates */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Carbohydrates</span>
              <span>{carbGrams}g ({Math.round(carbPercentage)}%)</span>
            </div>
            <Progress value={carbPercentage} className="h-2 bg-muted" 
              style={{ backgroundColor: "rgba(var(--primary), 0.2)" }} />
          </div>
          
          {/* Fat */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Fat</span>
              <span>{fatGrams}g ({Math.round(fatPercentage)}%)</span>
            </div>
            <Progress value={fatPercentage} className="h-2" 
              style={{ backgroundColor: "rgba(var(--warning), 0.2)" }} />
          </div>
          
          {/* Protein */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Protein</span>
              <span>{proteinGrams}g ({Math.round(proteinPercentage)}%)</span>
            </div>
            <Progress value={proteinPercentage} className="h-2" 
              style={{ backgroundColor: "rgba(var(--accent), 0.2)" }} />
          </div>
        </div>
        
        {/* Wind Impact Section */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Wind Impact:</span>
            </div>
            <span className="font-medium">{windImpact}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
