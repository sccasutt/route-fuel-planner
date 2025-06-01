
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { upsertRoutes as routesHandlerUpsert } from "./routesHandler.ts";

/**
 * Upsert Wahoo profile data
 */
export async function upsertWahooProfile(client: SupabaseClient, userId: string, wahooUserId: string, profile: any) {
  console.log(`Upserting Wahoo profile for user: ${userId} Wahoo user ID: ${wahooUserId}`);
  
  const profileData = {
    id: userId, // Use the JWT user_id as the primary key
    wahoo_user_id: wahooUserId.toString(),
    weight_kg: profile.weight ? parseFloat(profile.weight) : null,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await client
    .from('wahoo_profiles')
    .upsert(profileData, {
      onConflict: 'id'
    });

  if (error) {
    console.error("Error upserting Wahoo profile:", error);
    throw new Error("Failed to upsert Wahoo profile");
  }

  console.log(`Successfully upserted Wahoo profile for user: ${userId}`);
}

/**
 * Upsert routes with access token parameter
 */
export async function upsertRoutes(client: SupabaseClient, userId: string, activities: any[], accessToken: string) {
  return await routesHandlerUpsert(client, userId, activities, accessToken);
}
