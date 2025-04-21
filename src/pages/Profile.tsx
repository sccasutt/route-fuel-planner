import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Settings, Bell, Shield, CreditCard, LogOut } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  age: z.string().optional(),
  weight: z.string().optional(),
  goalType: z.string(),
  dietType: z.string(),
  allergies: z.string().optional(),
  intolerances: z.string().optional(),
  bio: z.string().max(500, { message: "Bio cannot exceed 500 characters" }).optional(),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("personal");
  const { profile, loading } = useUserProfile();
  const { user, signOut } = useAuth();
  const [isWahooConnected, setIsWahooConnected] = useState(false);
  const [wahooLoading, setWahooLoading] = useState(false);

  const defaultValues: Partial<ProfileFormValues> = {
    name: profile?.full_name || "",
    email: user?.email || "",
    age: profile?.age ? String(profile.age) : "",
    weight: profile?.weight ? String(profile.weight) : "",
    goalType: profile?.goal_type || "general",
    dietType: profile?.diet_type || "none",
    allergies: "",
    intolerances: "",
    bio: "Passionate cyclist looking to improve endurance and track nutrition for better performance.",
    emailNotifications: true,
    pushNotifications: false,
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  useEffect(() => {
    if (profile && !loading) {
      form.reset({
        name: profile.full_name || "",
        email: user?.email || "",
        age: profile.age ? String(profile.age) : "",
        weight: profile.weight ? String(profile.weight) : "",
        goalType: profile.goal_type || "general",
        dietType: profile.diet_type || "none",
        allergies: "",
        intolerances: "",
        bio: form.getValues("bio"),
        emailNotifications: form.getValues("emailNotifications"),
        pushNotifications: form.getValues("pushNotifications"),
      });
    }
  }, [profile, loading, user, form]);

  const handleConnectWahoo = async () => {
    setWahooLoading(true);
    try {
      const userAccessToken = "user-oauth-access-token-placeholder"; // Replace with real token from OAuth flow

      const response = await fetch("/api/wahoo-fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token: userAccessToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Wahoo profile");
      }

      const data = await response.json();

      if (data.profile) {
        setIsWahooConnected(true);
        form.setValue("weight", String(data.profile.weight_kg ?? ""));
        form.setValue("age", String(data.profile.age ?? ""));
      }

      toast({
        title: "Connected to Wahoo",
        description: "Successfully retrieved your data from Wahoo",
      });
    } catch (error) {
      console.error("Error connecting to Wahoo:", error);
      toast({
        title: "Connection failed",
        description: "Could not connect to Wahoo API",
        variant: "destructive",
      });
    } finally {
      setWahooLoading(false);
    }
  };

  const handleDisconnectWahoo = () => {
    setIsWahooConnected(false);
    toast({
      title: "Disconnected from Wahoo",
      description: "Your Wahoo account has been disconnected",
    });
  };

  async function onSubmit(data: ProfileFormValues) {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.name,
          age: data.age ? parseInt(data.age) : null,
          weight: data.weight ? parseFloat(data.weight) : null,
          goal_type: data.goalType,
          diet_type: data.dietType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    }
  }

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex items-center justify-center h-[50vh]">
            <p>Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <Button variant="destructive" className="gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <h2 className="font-semibold text-lg">{profile?.full_name || "Your Name"}</h2>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <Button variant="outline" className="w-full gap-2">
                    <Shield className="h-4 w-4" />
                    Premium Member
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="border rounded-lg">
              <Tabs defaultValue="personal" orientation="vertical" onValueChange={setSelectedTab}>
                <TabsList className="flex flex-col items-stretch h-auto p-0 bg-transparent">
                  <TabsTrigger
                    value="personal"
                    className="justify-start px-4 py-3 rounded-none border-b data-[state=active]:bg-muted"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Personal Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="justify-start px-4 py-3 rounded-none border-b data-[state=active]:bg-muted"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger
                    value="billing"
                    className="justify-start px-4 py-3 rounded-none border-b data-[state=active]:bg-muted"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Subscription
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="justify-start px-4 py-3 rounded-none data-[state=active]:bg-muted"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {selectedTab === "personal" && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your basic profile information</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="john.doe@example.com" {...field} readOnly />
                                </FormControl>
                                <FormDescription>
                                  Contact support to change email
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="age"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Age</FormLabel>
                                <FormControl>
                                  <Input placeholder="35" type="number" {...field} />
                                </FormControl>
                                <FormDescription>
                                  {isWahooConnected ? "Synced from Wahoo" : "Used for more accurate calculations"}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="weight"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Weight (kg)</FormLabel>
                                <FormControl>
                                  <Input placeholder="75" type="number" {...field} />
                                </FormControl>
                                <FormDescription>
                                  {isWahooConnected ? "Synced from Wahoo" : "Used for energy expenditure calculations"}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="goalType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Primary Goal</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select your goal" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="general">General Health</SelectItem>
                                    <SelectItem value="endurance">Endurance Training</SelectItem>
                                    <SelectItem value="performance">Performance Optimization</SelectItem>
                                    <SelectItem value="weight">Weight Management</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="dietType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Dietary Preference</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select diet type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">No Preference</SelectItem>
                                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                                    <SelectItem value="vegan">Vegan</SelectItem>
                                    <SelectItem value="keto">Keto</SelectItem>
                                    <SelectItem value="paleo">Paleo</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="allergies"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Allergies</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., nuts, shellfish" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Enter any food allergies, separated by commas
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="intolerances"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Food Intolerances</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., lactose, gluten" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Enter any food intolerances, separated by commas
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-center">
                          {!isWahooConnected ? (
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={handleConnectWahoo}
                              disabled={wahooLoading}
                              className="gap-2"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 17.5L6 14.5V8L12 5L18 8V14.5L12 17.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              {wahooLoading ? "Connecting..." : "Connect to Wahoo"}
                            </Button>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="text-sm text-green-600 mb-2">✓ Connected to Wahoo</div>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleDisconnectWahoo}
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                Disconnect
                              </Button>
                            </div>
                          )}
                        </div>

                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us about yourself and your cycling goals"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                A brief description about yourself
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </>
                )}

                {selectedTab === "notifications" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>
                        Manage how you receive notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
                                Receive email notifications for new nutrition plans, route analyses, and account updates.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pushNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Push Notifications</FormLabel>
                              <FormDescription>
                                Receive push notifications for upcoming rides, hydration reminders, and nutrition alerts.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {selectedTab === "billing" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Subscription Management</CardTitle>
                      <CardDescription>
                        Manage your subscription and billing details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">Premium Plan</h3>
                            <p className="text-sm text-muted-foreground">
                              $9.99 / month
                            </p>
                          </div>
                          <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                            Active
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="space-y-2">
                          <p className="text-sm">Next billing date: April 15, 2023</p>
                          <p className="text-sm text-muted-foreground">
                            Payment method: Credit Card **** 4242
                          </p>
                        </div>
                        <div className="flex gap-4 mt-6">
                          <Button variant="outline" className="gap-2">
                            <CreditCard className="h-4 w-4" />
                            Update Payment Method
                          </Button>
                          <Button variant="secondary" className="gap-2">
                            View Billing History
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4 bg-muted/50">
                        <h3 className="font-semibold">Premium Features</h3>
                        <ul className="mt-4 space-y-2">
                          <li className="flex items-center text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                            AI-powered nutrition recommendations
                          </li>
                          <li className="flex items-center text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                            Advanced route planning tools
                          </li>
                          <li className="flex items-center text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                            Personalized recipe suggestions
                          </li>
                          <li className="flex items-center text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                            Weather-based hydration planning
                          </li>
                          <li className="flex items-center text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                            Unlimited route storage
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedTab === "settings" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>
                        Manage your account security and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Security</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button variant="outline" className="w-full justify-start gap-2">
                            <Shield className="h-4 w-4" />
                            Change Password
                          </Button>
                          <Button variant="outline" className="w-full justify-start gap-2">
                            <Shield className="h-4 w-4" />
                            Two-Factor Authentication
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="font-semibold">Data Management</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button variant="outline" className="w-full justify-start gap-2">
                            <Shield className="h-4 w-4" />
                            Export Your Data
                          </Button>
                          <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
                            <Shield className="h-4 w-4" />
                            Delete Account
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="font-semibold">Connected Accounts</h3>
                        <div className="rounded-lg border p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                <svg className="h-6 w-6 text-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 17.5L6 14.5V8L12 5L18 8V14.5L12 17.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium">Wahoo</p>
                                <p className="text-sm text-muted-foreground">
                                  {isWahooConnected 
                                    ? "Connected on " + new Date().toLocaleDateString() 
                                    : "Not connected"
                                  }
                                </p>
                              </div>
                            </div>
                            {isWahooConnected ? (
                              <Button variant="outline" size="sm" onClick={handleDisconnectWahoo}>Disconnect</Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={handleConnectWahoo} disabled={wahooLoading}>
                                {wahooLoading ? "Connecting..." : "Connect"}
                              </Button>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" className="gap-2">
                          <Shield className="h-4 w-4" />
                          Connect Another Service
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end">
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
