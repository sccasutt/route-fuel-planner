
import { Calendar } from "lucide-react";
import { formatShortDate } from "@/lib/utils";
import { ExtractRouteDataButton } from "./ExtractRouteDataButton";
import { useState } from "react";

interface RouteHeaderProps {
  name: string;
  date: string;
  routeId?: string;
  gpxFileUrl?: string | null;
  fileUrl?: string | null;
  wahooRouteId?: string | null;
}

export function RouteHeader({ 
  name, 
  date, 
  routeId,
  gpxFileUrl,
  fileUrl,
  wahooRouteId
}: RouteHeaderProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleExtractSuccess = () => {
    // Increment the refresh key to trigger a re-fetch of data in parent components
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{name}</h1>
        <div className="flex items-center text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{formatShortDate(date)}</span>
        </div>
      </div>
      
      {/* Show the extract button if we have a routeId and file URL */}
      {routeId && (gpxFileUrl || fileUrl) && (
        <ExtractRouteDataButton 
          routeId={routeId}
          gpxFileUrl={gpxFileUrl}
          fileUrl={fileUrl}
          wahooRouteId={wahooRouteId}
          onSuccess={handleExtractSuccess}
        />
      )}
      
      {/* Hidden element to trigger re-renders */}
      <input type="hidden" value={refreshKey} />
    </div>
  );
}
