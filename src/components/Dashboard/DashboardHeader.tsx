
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface DashboardHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export function DashboardHeader({ onRefresh, isLoading }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">Your Dashboard</h1>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
          <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>
    </div>
  );
}
