
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function WahooCallback() {
  const [status, setStatus] = useState("Processing...");
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // This page is a fallback if the edge function doesn't redirect properly
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");
    const wahooSuccess = searchParams.get("wahoo_success");
    const wahooError = searchParams.get("wahoo_error");

    // If we have direct success/error params from our edge function
    if (wahooSuccess === "true") {
      setStatus("Connected! Redirecting...");
      toast({
        title: "Wahoo Connected",
        description: "Your Wahoo account was successfully connected.",
        variant: "success",
      });
      
      // Make sure token is set
      localStorage.setItem("wahoo_token", "connected");
      window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
      
      // Go to dashboard after short delay
      setTimeout(() => navigate("/dashboard"), 1500);
      return;
    }

    if (wahooError) {
      setStatus("Failed to connect to Wahoo.");
      toast({
        title: "Wahoo Connection Failed",
        description: wahooError,
        variant: "destructive",
      });
      // Go to dashboard after short delay
      setTimeout(() => navigate("/dashboard"), 2000);
      return;
    }

    // If we have the original OAuth callback params
    if (error) {
      setStatus("Failed to connect to Wahoo.");
      toast({
        title: "Wahoo Connection Failed",
        description: errorDesc || error,
        variant: "destructive",
      });
      // Go to dashboard after short delay
      setTimeout(() => navigate("/dashboard"), 2000);
      return;
    }

    if (!code) {
      setStatus("No authorization code found.");
      toast({
        title: "Wahoo Connection Error",
        description: "No OAuth code returned from Wahoo.",
        variant: "destructive",
      });
      setTimeout(() => navigate("/dashboard"), 2000);
      return;
    }

    // If we have a code but no success parameter, we need to exchange it
    // This is a fallback if the edge function didn't handle it
    setStatus("Connecting to Wahoo...");
    toast({
      title: "Processing",
      description: "Connecting to Wahoo...",
    });
    
    // Redirect to dashboard after a delay
    // In a real implementation, you might want to handle the code exchange here
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  }, [navigate, toast, location.search]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="p-6 bg-card border rounded-lg shadow-sm">
        <h1 className="text-xl font-bold mb-4">Wahoo Connection</h1>
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
