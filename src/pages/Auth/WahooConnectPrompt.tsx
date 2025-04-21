
import React from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { WahooConnectButton } from "@/components/Wahoo/WahooConnectButton";

export default function WahooConnectPrompt({ onSkip }: { onSkip: () => void }) {
  return (
    <Layout>
      <div className="container max-w-md mx-auto py-12">
        <div className="space-y-8 text-center">
          <h1 className="text-3xl font-bold">Sign up successful!</h1>
          <p className="text-muted-foreground">
            You can connect your Wahoo account now, or do this later from your dashboard.
          </p>
          <div className="flex flex-col items-center gap-4">
            <div>
              <WahooConnectButton />
            </div>
            <Button 
              onClick={onSkip} 
              variant="secondary"
              className="mt-4"
            >
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
