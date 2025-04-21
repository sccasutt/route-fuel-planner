
import { WahooConnectButton } from "@/components/Wahoo/WahooConnectButton";

export function ConnectedAccountsCard() {
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
      <div className="flex gap-3 flex-wrap">
        <WahooConnectButton />
      </div>
    </div>
  );
}
