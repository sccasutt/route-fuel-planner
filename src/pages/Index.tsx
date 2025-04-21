
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Star, Map, Utensils, LineChart } from "lucide-react";

const featureList = [
  {
    title: "Route Planning",
    desc: "Find and create the best cycling routes with intelligent suggestions.",
    icon: Map,
    color: "from-route-300 to-route-100",
  },
  {
    title: "Personalized Nutrition",
    desc: "Track your nutrition for peak performance before, during, and after your rides.",
    icon: Utensils,
    color: "from-nutrition-200 to-nutrition-50",
  },
  {
    title: "Progress Tracking",
    desc: "See your cycling stats & improvements over time with beautiful charts.",
    icon: LineChart,
    color: "from-pedalplate-200 to-pedalplate-50",
  },
];

const Index = () => {
  const { user } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative flex flex-col-reverse md:flex-row items-center justify-between px-4 py-16 md:py-28 bg-gradient-to-br from-pedalplate-50 via-pedalplate-100 to-pedalplate-300 dark:from-background dark:via-muted/70 dark:to-background transition-colors duration-700">
        {/* Text Box */}
        <div className="w-full md:w-1/2 z-10 text-left md:pr-12 fade-in">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-5 leading-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-pedalplate-500 to-route-500">PedalPlate</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-xl">
            <span className="inline-block font-semibold text-primary">Your ultimate cycling companion,</span> combining smart route planning, nutrition, and performance tools — all in one beautifully simple app.
          </p>
          <div className="flex gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] shadow-lg">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="lg" className="bg-pedalplate-500 hover:bg-pedalplate-600 animate-fade-in shadow-lg">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
        {/* Image */}
        <div className="w-full md:w-1/2 mb-8 md:mb-0 flex items-center justify-center relative">
          <img
            src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80"
            alt="Cyclist hero"
            className="rounded-xl shadow-xl w-full max-w-md object-cover border-4 border-white/60 dark:border-muted/50 animate-fade-in"
            loading="lazy"
          />
          <Star className="absolute top-2 right-8 text-yellow-400 opacity-80 animate-pulse" size={34} />
        </div>
        {/* Decorative Blob */}
        <div className="absolute left-0 top-0 w-[380px] h-[380px] blur-3xl rounded-full bg-pedalplate-200 opacity-40 -z-10" />
        <div className="absolute right-0 bottom-0 w-[220px] h-[220px] blur-2xl rounded-full bg-route-100 opacity-30 -z-10" />
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 md:px-8 py-14 md:py-18">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 animate-fade-in">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pedalplate-500 to-nutrition-500">Features</span> built for cyclists
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7 max-w-5xl mx-auto">
          {featureList.map((feature) => (
            <div
              key={feature.title}
              className={`card-gradient p-6 rounded-xl shadow-md hover:scale-105 transition-transform duration-200 bg-gradient-to-br ${feature.color} dark:bg-card animate-scale-in`}
            >
              <div className="flex items-center mb-4">
                <feature.icon className="h-7 w-7 text-primary mr-2" />
                <span className="text-lg font-semibold">{feature.title}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-base">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
