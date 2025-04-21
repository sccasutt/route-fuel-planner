
import { useEffect, useState, useRef } from "react";
import Layout from "@/components/layout/Layout";
import WahooCallbackError from "./WahooCallbackError";
import WahooCallbackLoading from "./WahooCallbackLoading";
import { useProcessWahooCallback } from "@/hooks/wahoo/useProcessWahooCallback";

export default function WahooCallback() {
  const [status, setStatus] = useState("Processing Wahoo authorization...");
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);
  const { processCallback } = useProcessWahooCallback({ setStatus, setError });

  useEffect(() => {
    // Only process the callback once using ref to track state across re-renders
    if (!processingRef.current) {
      processingRef.current = true;
      console.log("WahooCallback: Initializing callback processing");
      processCallback().catch(err => {
        console.error("Unhandled error in processCallback:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setStatus("Authorization failed due to an unexpected error");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
