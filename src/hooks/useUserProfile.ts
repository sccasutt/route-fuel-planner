
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;
    async function fetchProfile() {
      setLoading(true);
      const { data: { user }} = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (!ignore) {
        setProfile(data ?? null);
        setLoading(false);
      }
    }
    fetchProfile();
    return () => { ignore = true; };
  }, []);
  return { profile, loading };
}
