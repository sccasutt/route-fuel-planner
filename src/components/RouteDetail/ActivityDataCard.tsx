
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Bike, Wind } from "lucide-react";

interface ActivityDataCardProps {
  title: string;
  items: Array<{
    label: string;
    value: string | number;
    icon: React.ElementType;
  }>;
}

export function ActivityDataCard({ title, items }: ActivityDataCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {items.map((item, index) => (
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
