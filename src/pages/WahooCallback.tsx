
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { exchangeCodeForToken } from "@/components/Wahoo/WahooApi";

export default function WahooCallback() {
  const [status, setStatus] = useState("Processing Wahoo authorization...");
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get query parameters from URL
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const errorDesc = searchParams.get("error_description");
        const state = searchParams.get("state");
        const storedState = localStorage.getItem("wahoo_auth_state");
        
        console.log("WahooCallback: Processing callback with params:", { 
          code: code ? "Present" : "Missing",
          error,
          errorDesc,
          state,
          storedState,
          allParams: Object.fromEntries(searchParams.entries())
        });
        
        // Check for errors from Wahoo
        if (error) {
          console.error("Wahoo authorization error:", error, errorDesc);
          setStatus("Authorization failed.");
          toast({
            title: "Wahoo Connection Failed",
            description: errorDesc || error,
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 2000);
          return;
        }
        
        // Validate state to prevent CSRF attacks
        if (state !== storedState) {
          console.error("Wahoo callback state mismatch:", { state, storedState });
          setStatus("Invalid authorization state.");
          toast({
            title: "Security Error",
            description: "Authorization validation failed",
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 2000);
          return;
        }
        
        // Check for code
        if (!code) {
          console.error("No authorization code received from Wahoo");
          setStatus("No authorization code received.");
          toast({
            title: "Connection Error",
            description: "No authorization code was received from Wahoo",
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 2000);
          return;
        }
        
        console.log("WahooCallback: Valid authorization code received, exchanging for token");
        setStatus("Connecting to your Wahoo account...");
        
        // Exchange the code for a token
        const redirectUri = `${window.location.origin}/wahoo-callback`;
        const tokenData = await exchangeCodeForToken(code, redirectUri);
        
        // Store token data
        localStorage.setItem("wahoo_token", JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Date.now() + (tokenData.expires_in * 1000)
        }));
        
        // Trigger global connection event so all components are updated
        window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
        
        setStatus("Successfully connected to Wahoo!");
        toast({
          title: "Wahoo Connected",
          description: "Your Wahoo account was successfully connected.",
        });
        
        // Clean up the state
        localStorage.removeItem("wahoo_auth_state");
        
        // Redirect back to dashboard after a delay
        setTimeout(() => navigate("/dashboard", { state: { wahooConnected: true }}), 1500);
      } catch (error) {
        console.error("Error processing Wahoo callback:", error);
        setStatus("An error occurred while processing authorization.");
        toast({
          title: "Connection Error",
          description: "Failed to connect to Wahoo. Please try again.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    };
    
    processCallback();
  }, [navigate, toast, location.search]);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="p-6 bg-card border rounded-lg shadow-sm">
          <h1 className="text-xl font-bold mb-4">Wahoo Connection</h1>
          <p className="text-sm text-muted-foreground mb-2">{status}</p>
          <div className="flex justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
