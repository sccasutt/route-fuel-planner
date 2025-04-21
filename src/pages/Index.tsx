
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { Bike, BarChart, Utensils, Map, Droplet, UserPlus, RotateCw } from "lucide-react";

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-background to-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="p-2 bg-primary/10 rounded-full">
              <Bike className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Optimize Your <span className="text-primary">Cycling Nutrition</span>
            </h1>
            <p className="max-w-[700px] text-lg md:text-xl text-muted-foreground">
              Personalized nutrition plans and route analysis for cyclists.
              Fuel your ride with precision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  <UserPlus className="h-5 w-5" />
                  Get Started
                </Button>
              </Link>
              <Link to="/features">
                <Button size="lg" variant="outline" className="gap-2">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 gap-6 md:gap-10 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-6 bg-muted rounded-lg border shadow-sm">
              <Map className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Route Analysis</h3>
              <p className="text-muted-foreground">
                Analyze your cycling routes and get detailed insights about elevation, distance, and energy expenditure.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-muted rounded-lg border shadow-sm">
              <Utensils className="h-10 w-10 text-accent mb-4" />
              <h3 className="text-xl font-bold mb-2">Nutrition Planning</h3>
              <p className="text-muted-foreground">
                Personalized nutrition plans based on your route data, weight, goals, and dietary preferences.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-muted rounded-lg border shadow-sm">
              <Droplet className="h-10 w-10 text-secondary mb-4" />
              <h3 className="text-xl font-bold mb-2">Hydration Insights</h3>
              <p className="text-muted-foreground">
                Calculate your optimal hydration strategy based on route distance, weather, and personal factors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">How PedalPlate Works</h2>
            <p className="text-muted-foreground mt-2">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <UserPlus className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Create Profile</h3>
              <p className="text-muted-foreground">
                Sign up and enter your personal details like weight, age, and cycling goals.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <RotateCw className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. Sync Your Routes</h3>
              <p className="text-muted-foreground">
                Connect with Wahoo to import your cycling routes or plan new ones directly in the app.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BarChart className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Get Recommendations</h3>
              <p className="text-muted-foreground">
                Receive personalized nutrition and hydration recommendations based on your route data.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Utensils className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">4. Fuel Your Ride</h3>
              <p className="text-muted-foreground">
                Access personalized recipes and meal plans to ensure optimal performance during your rides.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <h2 className="text-3xl font-bold">Ready to Fuel Your Rides?</h2>
            <p className="text-lg opacity-90 max-w-[600px]">
              Join PedalPlate today and transform your cycling nutrition with personalized plans.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="gap-2">
                  <UserPlus className="h-5 w-5" />
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="bg-transparent border-white gap-2">
                  Already a member? Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
