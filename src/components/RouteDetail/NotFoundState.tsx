
import Layout from "@/components/layout/Layout";

export function NotFoundState() {
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Route not found</h1>
        <p>The requested route could not be found.</p>
      </div>
    </Layout>
  );
}
