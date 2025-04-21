
import { useEffect, useState, useRef } from "react";
import Layout from "@/components/layout/Layout";
import WahooCallbackError from "./WahooCallbackError";
import WahooCallbackLoading from "./WahooCallbackLoading";
import { useProcessWahooCallback } from "@/hooks/wahoo/useProcessWahooCallback";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function WahooCallback() {
  const [status, setStatus] = useState("Processing Wahoo authorization...");
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);
  const { processCallback } = useProcessWahooCallback({ setStatus, setError });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only process the callback once using ref to track state across re-renders
    if (!processingRef.current) {
      processingRef.current = true;
      console.log("WahooCallback: Initializing callback processing");
      
      // Check if user is authenticated
      if (!user) {
        console.log("WahooCallback: No authenticated user found, storing token only");
        setStatus("Wahoo connected, but you need to log in to sync your data");
        setError("Please log in to your account to sync your Wahoo data");
        return;
      }
      
      processCallback().catch(err => {
        console.error("Unhandled error in processCallback:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setStatus("Authorization failed due to an unexpected error");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
          {!user && (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">You need to log in to sync your Wahoo data</p>
              <Button onClick={() => navigate("/auth")} variant="default">
                Log in to sync
              </Button>
              <Button onClick={() => navigate("/dashboard")} variant="outline">
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
