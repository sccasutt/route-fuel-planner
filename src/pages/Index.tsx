
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to PedalPlate</h1>
        <p className="text-lg text-gray-600 mb-8">
          Your ultimate companion for cycling adventures.
        </p>
        <div className="flex justify-center space-x-4">
          {user ? (
            <Link to="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button>Sign Up / Login</Button>
            </Link>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
