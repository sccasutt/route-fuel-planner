
import { Button } from "@/components/ui/button";
import { WahooLogoIcon } from "@/components/Wahoo/WahooIcons";
import { WahooResyncButton } from "@/components/Wahoo/WahooResyncButton";

interface WahooConnectPromptProps {
  setConnectionError: (error: string | null) => void;
}

export function WahooConnectPrompt({ setConnectionError }: WahooConnectPromptProps) {
  return (
    <div className="p-6 bg-muted rounded-lg border text-center">
      <div className="mb-4 flex justify-center">
        <WahooLogoIcon className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-xl font-bold mb-2">Connect Your Wahoo Account</h2>
      <p className="text-muted-foreground mb-4">
        Link your Wahoo account to automatically sync your routes and activities
      </p>
      <div className="flex justify-center">
        <WahooResyncButton 
          setConnectionError={setConnectionError}
          variant="default"
          size="default"
          label="Connect Wahoo"
        />
      </div>
    </div>
  );
}
