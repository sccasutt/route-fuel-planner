
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";

interface ConnectionAlertsProps {
  connectionError: string | null;
  syncComplete: boolean;
}

export function ConnectionAlerts({ connectionError, syncComplete }: ConnectionAlertsProps) {
  if (!connectionError && !syncComplete) return null;
  
  return (
    <>
      {connectionError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      )}

      {syncComplete && (
        <Alert variant="default" className="mb-6 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-500" />
          <AlertTitle>Sync Complete</AlertTitle>
          <AlertDescription>Your Wahoo data has been refreshed.</AlertDescription>
        </Alert>
      )}
    </>
  );
}
