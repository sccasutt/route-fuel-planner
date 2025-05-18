
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Wind } from "lucide-react";

interface WeatherDataCardProps {
  temperature?: string;
  windSpeed?: string;
  windDirection?: string;
}

export function WeatherDataCard({ temperature = "18°C", windSpeed = "12 km/h", windDirection = "NE" }: WeatherDataCardProps) {
  const weatherItems = [
    {
      label: "Temperature",
      value: temperature,
      icon: LineChart
    },
    {
      label: "Wind Speed",
      value: windSpeed,
      icon: Wind
    },
    {
      label: "Wind Direction",
      value: windDirection,
      icon: Wind
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Weather Conditions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {weatherItems.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center">
                <item.icon className="w-4 h-4 mr-1" />
                <span>{item.label}</span>
              </div>
              <p className="font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
