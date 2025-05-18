
import Layout from "@/components/layout/Layout";

export function LoadingState() {
  return (
    <Layout>
      <div className="container py-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading route data...</p>
        </div>
      </div>
    </Layout>
  );
}
