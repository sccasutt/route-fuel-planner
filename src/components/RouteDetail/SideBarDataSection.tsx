
import { WeatherDataCard } from "@/components/RouteDetail/WeatherDataCard";
import { MacronutrientCard } from "@/components/RouteDetail/MacronutrientCard";
import { EnergyPowerDataColumn } from "@/components/RouteDetail/DataColumns/EnergyPowerDataColumn";
import { ElevationDataColumn } from "@/components/RouteDetail/DataColumns/ElevationDataColumn";
import { RoutePointStats } from "@/hooks/useRoutePoints";

interface SideBarDataSectionProps {
  routeData: any;
  stats: RoutePointStats;
}

export function SideBarDataSection({ routeData, stats }: SideBarDataSectionProps) {
  return (
    <div className="space-y-6">
      <MacronutrientCard
        caloriesPowerBased={routeData.calories_power_based}
        caloriesEstimated={routeData.calories_estimated || routeData.calories}
        fatGrams={routeData.fat_grams}
        carbGrams={routeData.carb_grams}
        proteinGrams={routeData.protein_grams}
        weatherJson={routeData.weather_json}
      />
      <EnergyPowerDataColumn routeData={routeData} />
      <ElevationDataColumn 
        elevation={routeData.elevation}
        stats={stats} 
      />
      <WeatherDataCard 
        temperature={routeData.weather_json?.average_temperature || "18°C"}
        windSpeed={routeData.weather_json?.average_wind_speed || "12 km/h"}
        windDirection={routeData.weather_json?.average_wind_direction || "NE"}
      />
    </div>
  );
}
