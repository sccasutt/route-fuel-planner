
import React from "react";
import { Button } from "@/components/ui/button";

const WAHOO_AUTH_URL = "https://cloud-api.wahoofitness.com/oauth2/auth";
const CLIENT_ID = ""; // For security, do not expose your client ID here! It should come from the backend/edge function
const REDIRECT_URI =
  window.location.origin + "/functions/v1/wahoo-oauth"; // Must be whitelisted in Wahoo dev portal
const SCOPE = "user_read"; // Adjust scopes as needed for your app

export function WahooConnectButton() {
  const handleConnect = () => {
    // For superior security, obtain client_id dynamically via backend if possible
    // Here, the client ID is omitted for demo; you should configure it using secrets and redirect via edge function.
    window.location.href =
      `${WAHOO_AUTH_URL}?response_type=code` +
      `&client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(SCOPE)}`;
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

