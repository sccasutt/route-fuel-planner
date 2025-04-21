import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const Index = () => {
  return (
    <Layout>
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to PedalPlate</h1>
        <p className="text-lg text-gray-600 mb-8">
          Your ultimate companion for cycling adventures.
        </p>
        <div className="flex space-x-4">
          <Link to="/auth" className="text-primary underline">Sign Up / Login</Link>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
