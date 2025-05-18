
import React from "react";

export function RoutesLoadingState() {
  return (
    <div className="p-8 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading your routes...</p>
    </div>
  );
}
