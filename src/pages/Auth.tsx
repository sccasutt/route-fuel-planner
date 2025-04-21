
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";

type AuthMode = "login" | "signup";

const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    age: "",
    weight: "",
    goal_type: "",
    diet_type: "",
  });
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      const { email, password, name, age, weight, goal_type, diet_type } = form;

      // Get the current site URL dynamically
      const siteUrl = window.location.origin;
      console.log("Using redirect URL:", siteUrl + "/auth");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            age: age ? Number(age) : null,
            weight: weight ? Number(weight) : null,
            goal_type: goal_type || null,
            diet_type: diet_type || null,
          },
          emailRedirectTo: siteUrl + "/auth",
        },
      });

      setLoading(false);
      
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else if (data?.user?.identities?.length === 0) {
        // User already exists but hasn't confirmed their email
        toast({ 
          title: "Account already exists", 
          description: "This email is already registered. Please check your inbox for the confirmation email or try signing in.",
          duration: 6000
        });
      } else if (data?.user?.email_confirmed_at) {
        // Email already confirmed, user can login directly
        toast({ title: "Sign up successful", description: "You are now logged in." });
        navigate("/dashboard");
      } else {
        // New signup, needs email confirmation
        setConfirmationSent(true);
        toast({ 
          title: "Verification email sent", 
          description: "Please check your email to confirm your account.",
          duration: 6000
        });
      }
    } else {
      // login
      const { email, password } = form;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast({ 
            title: "Email not confirmed", 
            description: "Please check your inbox for the confirmation email.",
            duration: 6000
          });
        } else {
          toast({ title: "Login failed", description: error.message, variant: "destructive" });
        }
      } else {
        toast({ title: "Welcome!", description: "You are now logged in." });
        navigate("/dashboard");
      }
    }
  };

  if (confirmationSent) {
    return (
      <Layout>
        <div className="container max-w-md mx-auto py-12">
          <div className="space-y-6 text-center">
            <h1 className="text-3xl font-bold">Check your email</h1>
            <p className="text-muted-foreground">
              We've sent you a confirmation email. Please check your inbox and click the link to verify your account.
            </p>
            <Button 
              onClick={() => setConfirmationSent(false)} 
              variant="outline"
              className="mt-4"
            >
              Back to sign in
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-md mx-auto py-12">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-center">
            {mode === "login" ? "Login to PedalPlate" : "Sign up for PedalPlate"}
          </h1>
          <form className="space-y-4" onSubmit={handleAuth}>
            {mode === "signup" && (
              <>
                <Input
                  required
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                />
                <Input
                  name="age"
                  placeholder="Age (optional)"
                  type="number"
                  value={form.age}
                  onChange={handleChange}
                />
                <Input
                  name="weight"
                  placeholder="Weight in kg (optional)"
                  type="number"
                  value={form.weight}
                  onChange={handleChange}
                />
                <Input
                  name="goal_type"
                  placeholder="Goal (optional)"
                  value={form.goal_type}
                  onChange={handleChange}
                />
                <Input
                  name="diet_type"
                  placeholder="Diet type (optional)"
                  value={form.diet_type}
                  onChange={handleChange}
                />
              </>
            )}
            <Input
              required
              name="email"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="username"
            />
            <Input
              required
              name="password"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Loading..."
                : mode === "login"
                ? "Login"
                : "Sign Up"}
            </Button>
          </form>
          <div className="text-center text-sm">
            {mode === "login" ? (
              <>
                New to PedalPlate?{" "}
                <button
                  className="text-primary underline"
                  onClick={() => setMode("signup")}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  className="text-primary underline"
                  onClick={() => setMode("login")}
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuthPage;
