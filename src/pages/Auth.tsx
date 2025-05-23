
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import SignUpForm from "./Auth/SignUpForm";
import LoginForm from "./Auth/LoginForm";
import EmailConfirmationPrompt from "./Auth/EmailConfirmationPrompt";
import WahooConnectPrompt from "./Auth/WahooConnectPrompt";

type AuthMode = "login" | "signup";

interface LocationState {
  wahooConnected?: boolean;
}

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
  const [showWahooConnect, setShowWahooConnect] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  
  // Debug logging for troubleshooting
  useEffect(() => {
    console.log("Auth page rendered", { mode, confirmationSent, showWahooConnect });
  }, [mode, confirmationSent, showWahooConnect]);
  
  // Check if we were redirected from Wahoo with a connection
  useEffect(() => {
    if (locationState?.wahooConnected) {
      toast({ 
        title: "Wahoo Connected",
        description: "Your Wahoo account is connected but you need to log in to sync data",
        duration: 6000 
      });
    }
  }, [locationState, toast]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      const { email, password, name, age, weight, goal_type, diet_type } = form;
      const siteUrl = window.location.origin;
      console.log("Signing up with email:", email);
      
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
      console.log("Sign up response:", { data, error });

      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else if (data?.user?.identities?.length === 0) {
        toast({ 
          title: "Account already exists", 
          description: "This email is already registered. Please check your inbox for the confirmation email or try signing in.",
          duration: 6000
        });
      } else if (data?.user?.email_confirmed_at) {
        toast({ title: "Sign up successful", description: "You are now logged in." });
        setShowWahooConnect(true);
      } else {
        setConfirmationSent(true);
        toast({ 
          title: "Verification email sent", 
          description: "Please check your email to confirm your account.",
          duration: 6000
        });
      }
    } else {
      const { email, password } = form;
      console.log("Logging in with email:", email);
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      console.log("Login response:", { error });

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
        
        // If redirected from Wahoo, go back to dashboard
        if (locationState?.wahooConnected) {
          navigate("/dashboard");
        } else {
          // Normal login flow
          navigate("/dashboard");
        }
      }
    }
  };

  if (showWahooConnect) {
    return <WahooConnectPrompt onSkip={() => navigate("/dashboard")} />;
  }

  if (confirmationSent) {
    return <EmailConfirmationPrompt onBack={() => setConfirmationSent(false)} />;
  }

  return (
    <Layout>
      <div className="container max-w-md mx-auto py-12">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-center">
            {mode === "login" ? "Login to PedalPlate" : "Sign up for PedalPlate"}
          </h1>
          
          {locationState?.wahooConnected && (
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-center">
                Please log in to complete the connection with your Wahoo account and sync your data.
              </p>
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleAuth}>
            {mode === "signup" ? (
              <SignUpForm form={form} setForm={setForm} loading={loading} onSubmit={handleAuth} />
            ) : (
              <LoginForm form={form} setForm={setForm} loading={loading} onSubmit={handleAuth} />
            )}
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
}

export default AuthPage;
