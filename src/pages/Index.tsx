
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Utensils, LineChart } from "lucide-react";

const featureList = [
  {
    title: "Route Planning",
    desc: "Create and discover optimal cycling routes with helpful suggestions.",
    icon: Map,
  },
  {
    title: "Personalized Nutrition",
    desc: "Plan your fuel for every ride: before, during, and after.",
    icon: Utensils,
  },
  {
    title: "Progress Tracking",
    desc: "Effortlessly visualize your cycling stats and improvements.",
    icon: LineChart,
  },
];

const Index = () => {
  const { user } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-24 px-4 bg-gradient-to-br from-card via-white to-secondary/80">
        <div className="w-full max-w-xl flex flex-col items-center text-center gap-7">
          <span className="mb-3 inline-block px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary uppercase tracking-wider">
            Cyclist wellbeing, reimagined
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold font-serif leading-[1.15] text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
            PedalPlate
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mb-2">
            The <span className="font-semibold text-primary">simple companion</span> for planning, fueling, and progressing on every ride.
          </p>
          <p className="text-base text-gray-400/80 mb-4 max-w-md">
            Minimal interface. Built for clarity, focus, and momentum.
          </p>
          <div className="flex gap-3 justify-center">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="rounded-full px-7">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="lg" className="rounded-full px-7">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 md:px-8 py-20 flex flex-col items-center">
        <h2 className="text-2xl md:text-3xl font-bold font-serif text-center mb-12">
          <span className="inline-block pb-1 border-b-2 border-primary/20">
            Features built for cyclists
          </span>
        </h2>
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {featureList.map((feature) => (
            <Card key={feature.title} className="bg-white/90 dark:bg-background border border-muted rounded-2xl shadow-none hover:shadow-md hover:scale-[1.02] transition-all">
              <CardHeader className="flex flex-col items-center pb-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-primary/10 text-primary">
                  <feature.icon className="h-7 w-7" aria-hidden />
                </div>
                <CardTitle className="text-lg font-semibold font-serif text-primary mb-1">{feature.title}</CardTitle>
                <CardDescription className="text-center text-muted-foreground">{feature.desc}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
