
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
  created_at: string | null;
  updated_at: string | null;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
          setLoading(false);
          return;
        }

        // Using explicit typing for safe database querying
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id as any)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error);
          toast({
            title: "Error",
            description: "Failed to load user profile",
            variant: "destructive",
          });
        }

        if (!ignore) {
          if (data) {
            // Verify data exists before using type assertion
            setProfile(data as UserProfile);
          } else {
            setProfile(null);
          }
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

  return { profile, loading };
}
