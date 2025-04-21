import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Bike, Calendar, Clock, LineChart, Map, Route, Utensils, ArrowRight, Droplet, BarChart, TrendingUp } from "lucide-react";

// Add import for WahooConnectButton
import { WahooConnectButton } from "@/components/Wahoo/WahooConnectButton";

// Sample data
const sampleRoutes = [
  {
    id: 1,
    name: "Morning Hill Climb",
    date: "2023-04-15",
    distance: 28.5,
    elevation: 450,
    duration: "1h 24m",
    calories: 680,
  },
  {
    id: 2,
    name: "Weekend Long Ride",
    date: "2023-04-10",
    distance: 65.2,
    elevation: 725,
    duration: "3h 10m",
    calories: 1580,
  },
  {
    id: 3,
    name: "Recovery Flat Loop",
    date: "2023-04-08",
    distance: 18.3,
    elevation: 120,
    duration: "0h 52m",
    calories: 410,
  },
];

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("overview");

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>

        {/* New Connected Accounts tile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="mb-2 font-semibold text-lg flex items-center gap-2">
                {/* Use lucide link icon as "connected accounts" */}
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 1 7.072 0l1.414 1.414a5 5 0 1 1-7.072 7.072l-1.414-1.414" />
                  <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 0-7.072 0l-1.414 1.414a5 5 0 1 0 7.072 7.072l1.414-1.414" />
                </svg>
                Connected Accounts
              </div>
              <p className="text-muted-foreground mb-4 text-sm">
                Link your training platforms for easier activity and nutrition syncing.
              </p>
              <div className="flex gap-3 flex-wrap">
                <WahooConnectButton />
                {/* In the future, add more platform buttons here */}
              </div>
            </div>
          </div>
          {/* you can add other dashboard cards here if needed */}
        </div>

        <Tabs defaultValue="overview" onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid grid-cols-3 md:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Route className="w-5 h-5 mr-2 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Your latest cycling stats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Distance</p>
                      <p className="text-2xl font-bold">112 km</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Rides</p>
                      <p className="text-2xl font-bold">3</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Calories</p>
                      <p className="text-2xl font-bold">2,670</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Elevation</p>
                      <p className="text-2xl font-bold">1,295m</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link to="/routes">
                    <Button variant="ghost" size="sm" className="gap-1">
                      View all activity <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Utensils className="w-5 h-5 mr-2 text-accent" />
                    Nutrition Status
                  </CardTitle>
                  <CardDescription>Your current nutrition stats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Carbs</span>
                      <span>240g / 300g</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Protein</span>
                      <span>90g / 120g</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fat</span>
                      <span>60g / 80g</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Hydration</span>
                      <span>1.8L / 2.5L</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Link to="/nutrition">
                    <Button variant="ghost" size="sm" className="gap-1">
                      View nutrition plan <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-secondary" />
                    Upcoming Ride
                  </CardTitle>
                  <CardDescription>Your next planned route</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Coastal Loop Ride</h3>
                    <span className="text-sm text-muted-foreground">Tomorrow</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <Map className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">45 km</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">680 m</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">~2h 15m</span>
                    </div>
                    <div className="flex items-center">
                      <BarChart className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">~950 kcal</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm border-t pt-4">
                    <Droplet className="w-4 h-4 text-secondary" />
                    <span>Hydration needed: 1.5L</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link to="/routes/upcoming">
                    <Button variant="ghost" size="sm" className="gap-1">
                      View route details <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
            
            <div className="p-6 bg-muted rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Recent Routes</h2>
                <Link to="/routes">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sampleRoutes.map((route) => (
                  <Card key={route.id} className="overflow-hidden">
                    <div className="h-2 bg-primary" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{route.name}</CardTitle>
                      <CardDescription>{route.date}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center">
                          <Map className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{route.distance} km</span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{route.elevation} m</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{route.duration}</span>
                        </div>
                        <div className="flex items-center">
                          <LineChart className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{route.calories} kcal</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link to={`/routes/${route.id}`}>
                        <Button variant="ghost" size="sm">View Details</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Routes Tab */}
          <TabsContent value="routes">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Your Routes</h2>
                <div className="flex gap-4">
                  <Button variant="outline" className="gap-2">
                    <Bike className="h-4 w-4" />
                    Import from Wahoo
                  </Button>
                  <Button className="gap-2">
                    <Map className="h-4 w-4" />
                    Plan New Route
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {sampleRoutes.map((route) => (
                  <Card key={route.id} className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-4">
                      <div className="bg-muted p-6 flex flex-col justify-center">
                        <h3 className="font-semibold text-lg">{route.name}</h3>
                        <p className="text-sm text-muted-foreground">{route.date}</p>
                      </div>
                      <div className="col-span-3 p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Map className="w-4 h-4 mr-1" />
                              <span>Distance</span>
                            </div>
                            <p className="font-semibold">{route.distance} km</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <TrendingUp className="w-4 h-4 mr-1" />
                              <span>Elevation</span>
                            </div>
                            <p className="font-semibold">{route.elevation} m</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>Duration</span>
                            </div>
                            <p className="font-semibold">{route.duration}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <LineChart className="w-4 h-4 mr-1" />
                              <span>Calories</span>
                            </div>
                            <p className="font-semibold">{route.calories} kcal</p>
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <Link to={`/routes/${route.id}`}>
                            <Button variant="outline" size="sm" className="gap-2">
                              View Details
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Nutrition Planning</h2>
                <Button className="gap-2">
                  <Utensils className="h-4 w-4" />
                  Create New Plan
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart className="h-5 w-5 mr-2 text-accent" />
                      Macronutrient Breakdown
                    </CardTitle>
                    <CardDescription>Based on your recent rides</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                          <span>Carbohydrates (60%)</span>
                        </div>
                        <span className="font-medium">300g</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-accent mr-2"></div>
                          <span>Protein (25%)</span>
                        </div>
                        <span className="font-medium">125g</span>
                      </div>
                      <Progress value={25} className="h-2 bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-secondary mr-2"></div>
                          <span>Fat (15%)</span>
                        </div>
                        <span className="font-medium">75g</span>
                      </div>
                      <Progress value={15} className="h-2 bg-muted" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Droplet className="h-5 w-5 mr-2 text-secondary" />
                      Hydration Planning
                    </CardTitle>
                    <CardDescription>Fluid requirements for your rides</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Daily Recommendation</p>
                      <div className="flex items-center">
                        <Droplet className="h-6 w-6 text-secondary mr-2" />
                        <span className="text-2xl font-bold">2.5L</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">During Ride (per hour)</p>
                      <div className="flex items-center">
                        <Droplet className="h-6 w-6 text-secondary mr-2" />
                        <span className="text-2xl font-bold">0.7L</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Additional Based on Temperature</p>
                      <div className="flex items-center">
                        <Droplet className="h-6 w-6 text-secondary mr-2" />
                        <span className="text-2xl font-bold">+0.3L</span>
                        <span className="text-sm text-muted-foreground ml-2">per hour above 25°C</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended Recipes</CardTitle>
                  <CardDescription>Based on your nutrition needs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="h-40 bg-muted flex items-center justify-center">
                        <Utensils className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium">High-Carb Energy Bowl</h3>
                        <p className="text-sm text-muted-foreground mt-1">Perfect pre-ride meal with complex carbs</p>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">65g carbs</span>
                          <span className="px-2 py-1 bg-accent/10 text-accent rounded-md">15g protein</span>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="h-40 bg-muted flex items-center justify-center">
                        <Utensils className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium">Recovery Protein Smoothie</h3>
                        <p className="text-sm text-muted-foreground mt-1">Optimal post-ride recovery drink</p>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">40g carbs</span>
                          <span className="px-2 py-1 bg-accent/10 text-accent rounded-md">30g protein</span>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="h-40 bg-muted flex items-center justify-center">
                        <Utensils className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium">On-Ride Energy Bars</h3>
                        <p className="text-sm text-muted-foreground mt-1">Quick energy during long rides</p>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">30g carbs</span>
                          <span className="px-2 py-1 bg-accent/10 text-accent rounded-md">8g protein</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link to="/nutrition/recipes">
                    <Button variant="outline">View All Recipes</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;
