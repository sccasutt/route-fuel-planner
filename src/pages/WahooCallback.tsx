
import { useEffect, useState, useRef } from "react";
import Layout from "@/components/layout/Layout";
import WahooCallbackError from "./WahooCallbackError";
import WahooCallbackLoading from "./WahooCallbackLoading";
import { useProcessWahooCallback } from "@/hooks/wahoo/useProcessWahooCallback";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function WahooCallback() {
  const [status, setStatus] = useState("Processing Wahoo authorization...");
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);
  const authCheckedRef = useRef(false);
  const sessionCheckRef = useRef(false);
  const { processCallback } = useProcessWahooCallback({ setStatus, setError });
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for session first to ensure we have authenticated access
  useEffect(() => {
    if (!sessionCheckRef.current) {
      sessionCheckRef.current = true;
      
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error("Error retrieving session in WahooCallback:", error);
        }
        console.log("WahooCallback: Session check:", data.session ? "session found" : "no session");
        
        // If no session is found, redirect to login immediately
        if (!data.session) {
          setError("You must be logged in to connect your Wahoo account.");
          toast({
            title: "Authentication required",
            description: "Please log in before connecting your Wahoo account.",
          });
          setTimeout(() => navigate("/auth"), 2000);
        }
      });
    }
  }, [navigate, toast]);

  // Process callback only if user is logged in
  useEffect(() => {
    // Wait for auth state to be checked
    if (loading) return;
    
    // If user is not logged in, don't process the callback
    if (!user) {
      if (!authCheckedRef.current) {
        authCheckedRef.current = true;
        console.log("WahooCallback: User not logged in, redirecting to login");
        setStatus("Authentication required");
        setError("You must be logged in to connect your Wahoo account.");
      }
      return;
    }

    // Only process the callback once using ref to track state across re-renders
    if (!processingRef.current) {
      processingRef.current = true;
      console.log("WahooCallback: Initializing callback processing");
      
      // Process the callback now that we know user is logged in
      processCallback().catch(err => {
        console.error("Unhandled error in processCallback:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setStatus("Authorization failed due to an unexpected error");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

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
          {!user && !loading && (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">You need to log in to connect your Wahoo account</p>
              <Button onClick={() => navigate("/auth")} variant="default">
                Log in to connect
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
