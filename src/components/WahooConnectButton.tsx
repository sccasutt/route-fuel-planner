
import React from "react";
import { Button } from "@/components/ui/button";

// Updated to the correct Wahoo API domain
const WAHOO_AUTH_URL = "https://api.wahooligan.com/oauth/authorize";
const REDIRECT_URI = window.location.origin + "/functions/v1/wahoo-oauth"; // Must be whitelisted in Wahoo dev portal
const SCOPE = "user_read workout_read"; // Adjust scopes as needed for your app

export function WahooConnectButton() {
  const handleConnect = async () => {
    try {
      // Fetch the client ID from our secure edge function
      const response = await fetch(`${window.location.origin}/functions/v1/wahoo-oauth/get-client-id`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch client ID");
      }
      
      const { clientId } = await response.json();
      
      // Redirect to Wahoo authorization page
      window.location.href =
        `${WAHOO_AUTH_URL}?response_type=code` +
        `&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}`;
    } catch (error) {
      console.error("Error initiating Wahoo connection:", error);
      alert("Failed to connect to Wahoo. Please try again later.");
    }
  };

  return (
    <Button variant="outline" className="gap-2" onClick={handleConnect}>
      {/* Wahoo SVG icon */}
      <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
        <path d="M12 17.5L6 14.5V8L12 5L18 8V14.5L12 17.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Connect Wahoo
    </Button>
  );
}
