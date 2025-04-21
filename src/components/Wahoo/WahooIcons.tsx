
import React from "react";

export function WahooLogoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 17.5L6 14.5V8L12 5L18 8V14.5L12 17.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DisconnectIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
