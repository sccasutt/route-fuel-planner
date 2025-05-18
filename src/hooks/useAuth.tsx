
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: object) => Promise<{
    error: any;
    data: any;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // First set up the auth state listener to prevent race conditions
        const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
          console.log("Auth state changed:", event, newSession?.user?.id ? "User authenticated" : "No user");
          
          setSession(newSession);
          setUser(newSession?.user || null);
          
          // Notify about auth state changes
          if (event === 'SIGNED_IN' && newSession?.user) {
            toast({
              title: "Signed in",
              description: "You have successfully signed in.",
            });
          } else if (event === 'SIGNED_OUT') {
            toast({
              title: "Signed out",
              description: "You have been signed out.",
            });
            // Don't navigate here as it might cause loops
          }
        });
        
        // Then check for existing session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        console.log("Initial auth session check:", {
          hasSession: !!initialSession,
          error: sessionError?.message || "No error"
        });

        if (sessionError) throw sessionError;

        setSession(initialSession);
        setUser(initialSession?.user || null);
        setLoading(false);
        
        return () => {
          if (authListener && authListener.subscription) {
            authListener.subscription.unsubscribe();
          }
        };
      } catch (err: any) {
        console.error("Auth session error:", err.message);
        setError(err.message);
        setUser(null);
        setSession(null);
        setLoading(false);
      }
    };

    initAuth();
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      return { error: null };
    } catch (error: any) {
      console.error("Sign in error:", error.message);
      setError(error.message);
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata = {}) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      
      if (error) {
        throw error;
      }
      
      // Success message for sign up
      if (data) {
        toast({
          title: "Account Created",
          description: "Please check your email for verification instructions.",
        });
        return { error: null, data };
      }
      
      return { error: null, data };
    } catch (error: any) {
      console.error("Sign up error:", error.message);
      setError(error.message);
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      navigate('/');
    } catch (error: any) {
      console.error("Sign out error:", error.message);
      setError(error.message);
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
