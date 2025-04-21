
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserProfile {
  id: string;
  full_name: string | null;
  age: number | null;
  weight: number | null;
  goal_type: string | null;
  diet_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserConnection {
  id: string;
  user_id: string;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  created_at: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wahooConnection, setWahooConnection] = useState<UserConnection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    let ignore = false;
    
    async function fetchProfile() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setProfile(null);
          setWahooConnection(null);
          setLoading(false);
          return;
        }
        
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          toast({
            title: "Error",
            description: "Failed to load user profile",
            variant: "destructive",
          });
        }
        
        // Fetch Wahoo connection if exists
        const { data: connectionData, error: connectionError } = await supabase
          .from("user_connections")
          .select("*")
          .eq("user_id", user.id)
          .eq("provider", "wahoo")
          .maybeSingle();
        
        if (connectionError && connectionError.code !== 'PGRST116') {
          console.error("Error fetching Wahoo connection:", connectionError);
        }
        
        if (!ignore) {
          setProfile(profileData ?? null);
          setWahooConnection(connectionData ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        if (!ignore) {
          setLoading(false);
          toast({
            title: "Error",
            description: "An unexpected error occurred",
            variant: "destructive",
          });
        }
      }
    }
    
    fetchProfile();
    return () => { ignore = true; };
  }, [toast]);
  
  return { profile, wahooConnection, loading };
}
