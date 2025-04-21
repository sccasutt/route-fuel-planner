
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import React from "react";

export default function EmailConfirmationPrompt({ onBack }: { onBack: () => void }) {
  return (
    <Layout>
      <div className="container max-w-md mx-auto py-12">
        <div className="space-y-6 text-center">
          <h1 className="text-3xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            We've sent you a confirmation email. Please check your inbox and click the link to verify your account.
          </p>
          <Button 
            onClick={onBack} 
            variant="outline"
            className="mt-4"
          >
            Back to sign in
          </Button>
        </div>
      </div>
    </Layout>
  );
}
