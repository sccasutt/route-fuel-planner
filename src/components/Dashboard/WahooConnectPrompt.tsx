
import { WahooResyncButton } from "@/components/Wahoo/WahooResyncButton";

interface WahooConnectPromptProps {
  setConnectionError: (error: string | null) => void;
}

export function WahooConnectPrompt({ setConnectionError }: WahooConnectPromptProps) {
  return (
    <div className="p-6 bg-muted rounded-lg border text-center">
      <h2 className="text-xl font-bold mb-2">Connect Your Wahoo Account</h2>
      <p className="text-muted-foreground mb-4">
        Connect your Wahoo account to see your routes and activities
      </p>
      <WahooResyncButton 
        setConnectionError={setConnectionError}
        variant="default"
        size="default"
        label="Connect Wahoo"
      />
    </div>
  );
}
