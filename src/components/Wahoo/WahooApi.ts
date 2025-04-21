
import { supabase } from "@/integrations/supabase/client";

export async function fetchWahooClientId() {
  const { data, error } = await supabase.functions.invoke('wahoo-oauth/get-client-id', {
    method: 'GET'
  });
  if (error) {
    throw new Error(error.message || "Failed to get Wahoo Client ID");
  }
  if (!data || !data.clientId) {
    throw new Error("No client ID returned from server");
  }
  return data.clientId;
}
