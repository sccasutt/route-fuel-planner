
import { supabase } from "@/integrations/supabase/client";

export async function syncWahooProfileAndRoutes(tokenObj: { access_token: string; refresh_token: string }) {
  const { data, error } = await supabase.functions.invoke("wahoo-sync", {
    method: "POST",
    body: tokenObj,
  });

  if (error) {
    throw new Error(error.message || "Failed to sync Wahoo routes");
  }
  return data;
}
