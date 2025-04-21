
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import SignUpForm from "./Auth/SignUpForm";
import LoginForm from "./Auth/LoginForm";
import EmailConfirmationPrompt from "./Auth/EmailConfirmationPrompt";
import WahooConnectPrompt from "./Auth/WahooConnectPrompt";

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
  const [showWahooConnect, setShowWahooConnect] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      const { email, password, name, age, weight, goal_type, diet_type } = form;
      const siteUrl = window.location.origin;
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
};

export default AuthPage;
