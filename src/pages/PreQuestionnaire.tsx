
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";

// Pre-questionnaire schema using zod
const questionnaireSchema = z.object({
  weight_kg: z.string().min(1, "Enter your weight in kg"),
  age: z.string().min(1, "Enter your age"),
  goal: z.string().min(1, "Select your primary cycling goal"),
  diet_type: z.string().optional(),
  intolerances: z.string().optional(),
  allergies: z.string().optional(),
});

type QuestionnaireForm = z.infer<typeof questionnaireSchema>;

const GOALS = [
  { value: "general", label: "General Health" },
  { value: "endurance", label: "Endurance Training" },
  { value: "performance", label: "Performance Optimization" },
  { value: "weight", label: "Weight Management" },
];

const DIET_TYPES = [
  { value: "none", label: "No Preference" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
];

const PreQuestionnaire = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is authenticated and test Supabase connection
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
      } else {
        console.log("Authenticated user:", user);
      }
    };
    checkAuth();
  }, [navigate]);

  const form = useForm<QuestionnaireForm>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      weight_kg: "",
      age: "",
      goal: "",
      diet_type: "",
      intolerances: "",
      allergies: "",
    },
  });

  const onSubmit = async (data: QuestionnaireForm) => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      toast({ title: "Not logged in", description: "Please log in again." });
      navigate("/login");
      return;
    }

    try {
      const insert = {
        weight_kg: Number(data.weight_kg),
        age: Number(data.age),
        goal_type: data.goal,
        diet_type: data.diet_type || null,
        intolerances: data.intolerances
          ? data.intolerances.split(",").map((v) => v.trim())
          : [],
        allergies: data.allergies
          ? data.allergies.split(",").map((v) => v.trim())
          : [],
      };

      // Update user profile
      const { error } = await supabase
        .from("profiles")
        .update(insert)
        .eq("id", user.id);

      if (error) {
        console.error("Profile update error:", error);
        toast({ title: "Error", description: error.message });
        return;
      }

      toast({
        title: "Profile updated!",
        description: "Setup complete. Welcome to PedalPlate.",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Submission error:", error);
      toast({ 
        title: "Error", 
        description: "An error occurred while updating your profile." 
      });
    }
  };

  return (
    <Layout>
      <div className="container max-w-md mx-auto py-12">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-center">Tell us about yourself</h1>
          <p className="text-center text-muted-foreground">
            We'll use these details to personalize your nutrition & route planning.
          </p>
          <Form {...form}>
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} placeholder="e.g. 75" />
                    </FormControl>
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
                      <Input type="number" min={10} max={120} {...field} placeholder="e.g. 35" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Cycling Goal</FormLabel>
                    <FormControl>
                      <select className="w-full border border-input rounded-md px-3 py-2 bg-background" {...field}>
                        <option value="">Select goal</option>
                        {GOALS.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diet_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diet Type (optional)</FormLabel>
                    <FormControl>
                      <select className="w-full border border-input rounded-md px-3 py-2 bg-background" {...field}>
                        <option value="">No Preference</option>
                        {DIET_TYPES.filter(d => d.value !== "none").map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="intolerances"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intolerances (comma-separated, optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. gluten, nuts" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allergies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allergies (comma-separated, optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. peanuts, shellfish" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-2">
                Finish Setup
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
};

export default PreQuestionnaire;
