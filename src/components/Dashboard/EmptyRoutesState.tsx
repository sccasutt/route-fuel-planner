
import React from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function EmptyRoutesState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          No Routes Available
        </CardTitle>
        <CardDescription>
          No routes have been synced yet. Connect your Wahoo account to start
          importing your activities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Once you connect your account, your routes will appear here.</p>
        <p className="text-sm text-muted-foreground">
          If you've already connected your account and still don't see routes, try:
          <ul className="list-disc pl-5 mt-2">
            <li>Refreshing your data from the dashboard</li>
            <li>Checking your Wahoo connection status</li>
            <li>Ensuring you have routes in your Wahoo account</li>
          </ul>
        </p>
      </CardContent>
    </Card>
  );
}
