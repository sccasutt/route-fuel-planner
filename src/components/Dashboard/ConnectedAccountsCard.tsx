
import { WahooConnectButton } from "@/components/Wahoo/WahooConnectButton";
import { WahooResyncButton } from "@/components/Wahoo/WahooResyncButton";
import { useState, useEffect } from "react";
import { getWahooEmail } from "@/hooks/wahoo/wahooTokenUtils";

export function ConnectedAccountsCard() {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [wahooEmail, setWahooEmail] = useState<string | null>(null);
  
  // Check for Wahoo email on mount and when connection changes
  useEffect(() => {
    const updateEmail = () => {
      const email = getWahooEmail();
      console.log("ConnectedAccountsCard: Wahoo email:", email);
      setWahooEmail(email);
    };
    
    updateEmail();
    
    // Listen for connection changes
    window.addEventListener("wahoo_connection_changed", updateEmail);
    return () => {
      window.removeEventListener("wahoo_connection_changed", updateEmail);
    };
  }, []);

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-2 font-semibold text-lg flex items-center gap-2">
        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 1 7.072 0l1.414 1.414a5 5 0 1 1-7.072 7.072l-1.414-1.414" />
          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 0-7.072 0l-1.414 1.414a5 5 0 1 0 7.072 7.072l1.414-1.414" />
        </svg>
        Connected Accounts
      </div>
      <p className="text-muted-foreground mb-4 text-sm">
        Link your training platforms for easier activity and nutrition syncing.
      </p>
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 flex-wrap">
          <WahooConnectButton />
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <WahooResyncButton 
            setConnectionError={setConnectionError} 
            showEmail={true} 
          />
          
          {wahooEmail && (
            <div className="text-xs text-muted-foreground w-full mt-1">
              Connected account: {wahooEmail}
            </div>
          )}
          
          {connectionError && (
            <div className="text-xs text-red-500 w-full mt-1">
              Error: {connectionError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
