
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface WahooErrorAlertProps {
  connectionError: string | null;
}

export function WahooErrorAlert({ connectionError }: WahooErrorAlertProps) {
  if (!connectionError) return null;
  return (
    <Alert variant="destructive" className="mb-2">
      <AlertTitle className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Connection Error
      </AlertTitle>
      <AlertDescription>{connectionError}</AlertDescription>
    </Alert>
  );
}
