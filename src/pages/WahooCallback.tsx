
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { exchangeCodeForToken } from "@/components/Wahoo/WahooApi";
import { syncWahooProfileAndRoutes } from "@/components/Wahoo/WahooSyncApi";
import WahooCallbackError from "./WahooCallbackError";
import WahooCallbackLoading from "./WahooCallbackLoading";

const REDIRECT_URI = "https://www.pedalplate.food/wahoo-callback";
// Maximum state age - 15 minutes (in milliseconds)
const MAX_STATE_AGE = 15 * 60 * 1000;

export default function WahooCallback() {
  const [status, setStatus] = useState("Processing Wahoo authorization...");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get("code");
        const authError = searchParams.get("error");
        const errorDesc = searchParams.get("error_description");
        const stateFromURL = searchParams.get("state");
        
        // Retrieve and validate state from localStorage
        const storedStateJSON = localStorage.getItem("wahoo_auth_state");

        console.log("WahooCallback: Processing callback with params:", { 
          hasCode: !!code, 
          hasError: !!authError,
          hasStateFromURL: !!stateFromURL,
          hasStoredState: !!storedStateJSON,
          urlParams: Object.fromEntries(searchParams.entries())
        });

        if (authError) {
          console.error("Wahoo authorization error:", authError, errorDesc);
          setStatus("Authorization failed.");
          setError(errorDesc || authError);
          toast({
            title: "Wahoo connection failed",
            description: errorDesc || authError,
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 5000);
          return;
        }

        if (!stateFromURL) {
          console.error("Wahoo callback missing state parameter in URL");
          setStatus("Missing authorization state in response.");
          setError("Security error: Missing authorization state in response");
          toast({
            title: "Security error",
            description: "Missing authorization state in response",
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 5000);
          return;
        }

        if (!storedStateJSON) {
          console.error("Wahoo callback missing stored state parameter");
          setStatus("Missing local state reference.");
          setError("Security error: Your browser session may have expired. Please try again.");
          toast({
            title: "Security error",
            description: "Your browser session may have expired. Please try again.",
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 5000);
          return;
        }

        // Parse the stored state which now contains an object with value and timestamp
        let storedState: { value: string; created: number };
        try {
          storedState = JSON.parse(storedStateJSON);
        } catch (e) {
          console.error("Failed to parse stored state:", e);
          setStatus("Invalid local state data.");
          setError("Security error: Invalid state data");
          toast({
            title: "Security error",
            description: "Invalid state data",
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 5000);
          return;
        }

        // Check if the state is too old (potential security risk)
        const stateAge = Date.now() - storedState.created;
        if (stateAge > MAX_STATE_AGE) {
          console.error("Wahoo callback state expired:", { 
            ageMs: stateAge, 
            maxAgeMs: MAX_STATE_AGE 
          });
          setStatus("Authorization state expired.");
          setError("Security error: Authorization request expired. Please try again.");
          toast({
            title: "Security error",
            description: "Authorization request expired. Please try again.",
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 5000);
          return;
        }

        // Compare the actual state values
        if (stateFromURL !== storedState.value) {
          console.error("Wahoo callback state mismatch:", { 
            stateFromURL: stateFromURL?.substring(0, 5) + "...", 
            storedStateValue: storedState.value?.substring(0, 5) + "..." 
          });
          setStatus("Invalid authorization state.");
          setError("Security error: Authorization validation failed");
          toast({
            title: "Security error",
            description: "Authorization validation failed",
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 5000);
          return;
        }

        if (!code) {
          console.error("No authorization code received from Wahoo");
          setStatus("No authorization code received.");
          setError("No authorization code received from Wahoo");
          toast({
            title: "Connection error",
            description: "No authorization code received from Wahoo",
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 5000);
          return;
        }

        console.log("WahooCallback: Valid authorization code received, exchanging for token");
        setStatus("Connecting to your Wahoo account...");

        try {
          console.log("Using redirect URI:", REDIRECT_URI);
          const tokenData = await exchangeCodeForToken(code, REDIRECT_URI);

          if (!tokenData || !tokenData.access_token) {
            throw new Error("Invalid token response from server");
          }

          console.log("WahooCallback: Token received successfully");
          
          const saveObj = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: Date.now() + (tokenData.expires_in * 1000)
          };

          localStorage.setItem("wahoo_token", JSON.stringify(saveObj));
          console.log("WahooCallback: Token saved to localStorage");
          
          localStorage.removeItem("wahoo_auth_state");

          setStatus("Synchronizing your rides...");
          try {
            await syncWahooProfileAndRoutes(saveObj);
            setStatus("Your Wahoo data has been successfully synchronized!");
            
            window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
            console.log("WahooCallback: Dispatched connection changed event");
            
            toast({ 
              title: "Wahoo connected", 
              description: "Your Wahoo account is now connected." 
            });

            setTimeout(() => navigate("/dashboard", { state: { wahooConnected: true }}), 3000);
          } catch (err) {
            console.error("Error syncing rides:", err);

            const errMsg = err instanceof Error ? err.message : "Unknown error";
            if (errMsg.includes("connection") || 
                errMsg.includes("refused") ||
                errMsg.includes("unavailable") ||
                errMsg.includes("timeout")) {
              setStatus("Connected, but Wahoo service is currently unavailable for sync.");
              setError("Wahoo service is currently unavailable. Your connection is established, but your rides couldn't be synchronized. Please try to sync later.");
            } else {
              setStatus("Connected, but your rides couldn't be synchronized.");
              setError(errMsg || "Error synchronizing your rides from Wahoo");
            }
            
            // Despite sync error, we still successfully authenticated
            window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
            console.log("WahooCallback: Dispatched connection changed event despite sync error");
            
            toast({
              title: "Partial connection",
              description: "Connected to Wahoo, but couldn't sync rides. Try again later.",
              variant: "destructive",
            });
            
            // Still navigate to dashboard after a delay, connection was established
            setTimeout(() => navigate("/dashboard"), 5000);
          }
        } catch (tokenError) {
          console.error("Token exchange error:", tokenError);

          const tokenErrorMsg = tokenError instanceof Error ? tokenError.message : "Unknown error";
          let errorTitle = "Connection error";
          let errorDescription = "Failed to connect to Wahoo. Please try again.";

          if (tokenErrorMsg.includes("connection") || 
              tokenErrorMsg.includes("refused") ||
              tokenErrorMsg.includes("unavailable") ||
              tokenErrorMsg.includes("timeout")) {
            errorTitle = "Wahoo service unavailable";
            errorDescription = "The Wahoo service is currently unavailable. Please try again later.";
          }

          setStatus("An error occurred while connecting to Wahoo.");
          setError(errorDescription);
          toast({
            title: errorTitle,
            description: errorDescription,
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 5000);
        }
      } catch (error) {
        console.error("Error processing Wahoo callback:", error);
        setStatus("An error occurred during authorization processing.");
        setError("Failed to connect to Wahoo. Please try again.");
        toast({
          title: "Connection error",
          description: "Failed to connect to Wahoo. Please try again.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/dashboard"), 5000);
      }
    };

    processCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, toast, location.search]);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="p-6 bg-card border rounded-lg shadow-sm max-w-md w-full">
          <h1 className="text-xl font-bold mb-4">Wahoo Connection</h1>
          {error ? (
            <WahooCallbackError error={error} status={status} />
          ) : (
            <WahooCallbackLoading status={status} />
          )}
        </div>
      </div>
    </Layout>
  );
}
