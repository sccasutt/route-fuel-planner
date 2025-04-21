
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function WahooCallback() {
  const [status, setStatus] = useState("Processing...");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const errorDesc = url.searchParams.get("error_description");

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

    // Exchange the code for access token using an edge function (reusing existing logic)
    async function exchangeCode() {
      setStatus("Connecting to Wahoo...");
      try {
        const { data, error } = await supabase.functions.invoke('wahoo-oauth', {
          method: 'POST',
          body: { code }
        });
        if (error) throw new Error(error.message || "Exchange failed");
        // You might want to store a real wahoo_token from response, for now dummy:
        localStorage.setItem("wahoo_token", "connected");
        window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
        setStatus("Connected! Redirecting...");
        toast({
          title: "Wahoo Connected",
          description: "Your Wahoo account was successfully connected.",
          variant: "success",
        });
        setTimeout(() => navigate("/dashboard"), 1500);
      } catch (err: any) {
        setStatus("Failed to connect.");
        toast({
          title: "Connection Failed",
          description: err.message || "Unable to connect to Wahoo.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/dashboard"), 2500);
      }
    }
    exchangeCode();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="p-6 bg-card border rounded-lg shadow-sm">
        <h1 className="text-xl font-bold mb-4">Wahoo Connection</h1>
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
