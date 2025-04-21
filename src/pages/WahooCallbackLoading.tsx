
import React from "react";

interface WahooCallbackLoadingProps {
  status: string;
}

const WahooCallbackLoading: React.FC<WahooCallbackLoadingProps> = ({ status }) => (
  <>
    <p className="text-sm text-muted-foreground mb-4">{status}</p>
    <div className="flex justify-center">
      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  </>
);

export default WahooCallbackLoading;
