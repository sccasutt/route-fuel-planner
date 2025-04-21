
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Star, Map, Utensils, LineChart } from "lucide-react";

const featureList = [
  {
    title: "Route Planning",
    desc: "Create and discover optimal cycling routes with helpful suggestions.",
    icon: Map,
  },
  {
    title: "Personalized Nutrition",
    desc: "Plan your fuel for every ride, before, during, and after.",
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
      {/* Minimalist Soft Background */}
      <section className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 md:py-32 relative bg-gradient-to-br from-pedalplate-50 via-white to-route-50">
        {/* Hero Box */}
        <div className="w-full md:w-[36rem] flex flex-col items-center text-center gap-7 z-10">
          <span className="mb-2 inline-block px-3 py-1 rounded-full bg-pedalplate-100/80 text-xs font-medium text-pedalplate-700 uppercase tracking-widest shadow-sm">
            Cyclist wellbeing, reimagined
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold font-serif leading-tight text-transparent bg-clip-text bg-gradient-to-r from-pedalplate-600 to-route-500">
            PedalPlate
          </h1>
          <p className="text-base md:text-lg text-gray-500 max-w-xl mb-1">
            The <span className="font-semibold text-primary">simple companion</span> for planning, fueling, and progressing on every ride. Refreshingly minimal, designed for focus.
          </p>
          <div className="flex gap-3 justify-center mt-4">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="rounded-full bg-pedalplate-500/90 hover:bg-pedalplate-600/80 shadow-sm px-7">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="lg" className="rounded-full bg-pedalplate-500/90 hover:bg-pedalplate-600/80 shadow-sm px-7">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
        {/* Decorative Star */}
        <Star className="absolute top-8 right-10 text-pedalplate-200 opacity-70" size={36} />
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 md:px-8 py-16 flex flex-col items-center">
        <h2 className="text-2xl md:text-3xl font-bold font-serif text-center mb-10 relative">
          <span className="inline-block pb-1 border-b-2 border-pedalplate-300/60">
            Features built for cyclists
          </span>
        </h2>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 max-w-4xl mx-auto">
          {featureList.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center justify-start h-full bg-white/80 dark:bg-background border border-pedalplate-100 dark:border-muted rounded-2xl shadow-sm px-7 py-9 transition hover:shadow-md"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-pedalplate-100 text-pedalplate-600">
                <feature.icon className="h-7 w-7" aria-hidden />
              </div>
              <div className="text-lg font-semibold font-serif mb-2 text-pedalplate-700 dark:text-pedalplate-200">{feature.title}</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
