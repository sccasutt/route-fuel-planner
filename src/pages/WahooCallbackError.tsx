
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { useNavigate } from "react-router-dom";

interface WahooCallbackErrorProps {
  error: string;
  status: string;
}

const WahooCallbackError: React.FC<WahooCallbackErrorProps> = ({ error, status }) => {
  const navigate = useNavigate();
  return (
    <>
      <Alert variant="destructive" className="mb-4">
        <AlertTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Connection Error
        </AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      <p className="text-sm text-muted-foreground mb-4">{status}</p>
      <div className="flex justify-center">
        <Button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    </>
  );
};

export default WahooCallbackError;
