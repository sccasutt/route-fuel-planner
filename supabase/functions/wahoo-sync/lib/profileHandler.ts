
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * Upserts the Wahoo profile for a user
 */
export async function upsertWahooProfile(client: SupabaseClient, userId: string, wahooUserId: string, profile: any) {
  console.log(`Upserting Wahoo profile for user: ${userId} Wahoo user ID: ${wahooUserId}`);

  // First check if profile already exists
  const { data: existingProfile } = await client
    .from('wahoo_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Get the weight from the profile if available
  const weight = profile.weight ? parseFloat(profile.weight) : null;

  try {
    const { data, error } = await client
      .from('wahoo_profiles')
      .upsert({
        id: userId,
        wahoo_user_id: wahooUserId,
        weight_kg: weight,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error("Error upserting Wahoo profile:", error);
      throw new Error(`Failed to upsert Wahoo profile: ${error.message}`);
    }

    console.log(`Successfully upserted Wahoo profile for user: ${userId}`);
    return existingProfile ? 'updated' : 'created';
  } catch (error: any) {
    console.error("Exception upserting Wahoo profile:", error);
    throw new Error(`Failed to upsert Wahoo profile: ${error.message}`);
  }
}
