
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Bike, Calendar, Clock, Droplet, LineChart, Map, Pencil, TrendingUp, Utensils, Wind } from "lucide-react";
import RouteMap from "@/components/Map/RouteMap";

// Sample route data (would come from an API in a real app)
const sampleRoute = {
  id: 1,
  name: "Morning Hill Climb",
  date: "2023-04-15",
  distance: 28.5,
  elevation: 450,
  duration: "1h 24m",
  calories: 680,
  avgSpeed: 20.4,
  maxSpeed: 42.8,
  temperature: 18,
  windSpeed: 12,
  windDirection: "NE",
  nutrition: {
    carbs: 120,
    protein: 25,
    fat: 15,
    water: 1.5
  },
  // Sample coordinates for the route (would come from API)
  coordinates: [51.505, -0.09],
  // Sample route coordinates - in a real app, these would come from the route data
  routeCoordinates: [
    [51.505, -0.09],
    [51.51, -0.1],
    [51.52, -0.12],
    [51.518, -0.14],
    [51.51, -0.15],
    [51.5, -0.14],
    [51.495, -0.12],
    [51.505, -0.09],
  ]
};

const RouteDetail = () => {
  const { id } = useParams();
  // In a real app, fetch route by ID here
  const route = sampleRoute;

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{route.name}</h1>
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {route.date}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Map className="w-5 h-5 mr-2 text-primary" />
                Distance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{route.distance} km</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                Elevation Gain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{route.elevation} m</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Bike className="w-5 h-5 mr-2 text-primary" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{route.duration}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="h-[400px]">
              <CardHeader>
                <CardTitle>Route Map</CardTitle>
                <CardDescription>Elevation profile and route details</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[320px]">
                <RouteMap 
                  center={route.coordinates as [number, number]} 
                  zoom={13}
                  height="100%"
                  className="rounded-b-lg"
                  routeCoordinates={route.routeCoordinates as [number, number][]}
                  showControls={true}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Energy & Power</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <LineChart className="w-4 h-4 mr-1" />
                      <span>Calories</span>
                    </div>
                    <p className="font-semibold">{route.calories} kcal</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Bike className="w-4 h-4 mr-1" />
                      <span>Avg Speed</span>
                    </div>
                    <p className="font-semibold">{route.avgSpeed} km/h</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Bike className="w-4 h-4 mr-1" />
                      <span>Max Speed</span>
                    </div>
                    <p className="font-semibold">{route.maxSpeed} km/h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weather Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span>Temperature</span>
                    </div>
                    <p className="font-semibold">{route.temperature}°C</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Wind className="w-4 h-4 mr-1" />
                      <span>Wind Speed</span>
                    </div>
                    <p className="font-semibold">{route.windSpeed} km/h</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Wind className="w-4 h-4 mr-1" />
                      <span>Wind Direction</span>
                    </div>
                    <p className="font-semibold">{route.windDirection}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="nutrition" className="mt-8">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="nutrition">Nutrition Plan</TabsTrigger>
            <TabsTrigger value="notes">Notes & Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="nutrition" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Utensils className="h-5 w-5 mr-2 text-accent" />
                  Nutrition Requirements
                </CardTitle>
                <CardDescription>
                  Personalized nutrition plan based on this route's data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Carbohydrates</h3>
                      <div className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        60%
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{route.nutrition.carbs}g</p>
                    <p className="text-sm text-muted-foreground">
                      Primary energy source for high-intensity cycling
                    </p>
                  </div>
                  
                  <div className="space-y-2 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Protein</h3>
                      <div className="px-2 py-1 bg-accent/10 text-accent rounded-full text-sm">
                        15%
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{route.nutrition.protein}g</p>
                    <p className="text-sm text-muted-foreground">
                      Essential for muscle recovery after your ride
                    </p>
                  </div>
                  
                  <div className="space-y-2 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Fat</h3>
                      <div className="px-2 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
                        25%
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{route.nutrition.fat}g</p>
                    <p className="text-sm text-muted-foreground">
                      Secondary energy source for longer rides
                    </p>
                  </div>
                  
                  <div className="space-y-2 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Hydration</h3>
                      <div className="px-2 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
                        Important
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Droplet className="h-6 w-6 text-secondary mr-2" />
                      <p className="text-2xl font-bold">{route.nutrition.water}L</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Recommended fluid intake for your ride
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="font-semibold text-lg mb-4">Recommended Recipes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="h-40 bg-muted flex items-center justify-center">
                        <Utensils className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium">Energizing Oatmeal Bowl</h3>
                        <p className="text-sm text-muted-foreground mt-1">Perfect pre-ride breakfast</p>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">60g carbs</span>
                          <span className="px-2 py-1 bg-accent/10 text-accent rounded-md">15g protein</span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <div className="h-40 bg-muted flex items-center justify-center">
                        <Utensils className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium">Trail Mix Energy Bars</h3>
                        <p className="text-sm text-muted-foreground mt-1">For during your ride</p>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">35g carbs</span>
                          <span className="px-2 py-1 bg-accent/10 text-accent rounded-md">8g protein</span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <div className="h-40 bg-muted flex items-center justify-center">
                        <Utensils className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium">Recovery Smoothie</h3>
                        <p className="text-sm text-muted-foreground mt-1">Post-ride recovery drink</p>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">45g carbs</span>
                          <span className="px-2 py-1 bg-accent/10 text-accent rounded-md">25g protein</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button className="gap-2">
                    <Utensils className="h-4 w-4" />
                    Get Personalized Recipe Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notes & Analysis</CardTitle>
                <CardDescription>
                  Add notes and performance analysis for this route
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 mb-4">
                  <p className="text-muted-foreground italic">
                    No notes have been added for this route yet. Use the form below to add notes.
                  </p>
                </div>

                <form className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Add Note</label>
                    <textarea
                      className="w-full min-h-[100px] p-3 border rounded-md"
                      placeholder="Add your notes, observations, or performance analysis about this ride..."
                    ></textarea>
                  </div>
                  <Button>Save Note</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RouteDetail;
