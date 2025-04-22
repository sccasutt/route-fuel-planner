
export async function upsertWahooProfile(client: any, user_id: string, wahoo_user_id: string, profile: any) {
  console.log("Upserting Wahoo profile for user:", user_id, "Wahoo user ID:", wahoo_user_id);

  // Validate profile data 
  if (!profile) {
    console.warn("No profile data provided for upserting. Using minimal data.");
  }

  const { error } = await client.from("wahoo_profiles").upsert([{
    id: user_id,
    wahoo_user_id: wahoo_user_id,
    weight_kg: profile?.weight_kg || null,
    updated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  }]);

  if (error) {
    console.error("Error upserting Wahoo profile:", error);
    throw error;
  }

  console.log("Successfully upserted Wahoo profile for user:", user_id);
}

export async function upsertRoutes(client: any, user_id: string, activities: any[]) {
  console.log("Upserting routes for user:", user_id, "Activities count:", Array.isArray(activities) ? activities.length : 0);

  // Validate activities array
  if (!Array.isArray(activities)) {
    console.warn("Activities is not an array, skipping route upsert");
    return 0;
  }

  const routeRows = activities.map(act => {
    // Validate each activity has the minimum required fields
    if (!act || !act.id) {
      console.warn("Skipping invalid activity:", act);
      return null;
    }

    return {
      user_id: user_id,
      wahoo_route_id: act.id,
      name: act.name ?? "Wahoo Activity",
      distance: act.distance ?? 0,
      elevation: act.elevation_gain ?? 0,
      duration: act.duration ?? "",
      calories: act.calories ?? null,
      date: act.start_time ?? new Date().toISOString(),
      gpx_data: act.gpx_data ?? null,
      updated_at: new Date().toISOString()
    };
  }).filter(Boolean); // Remove any null entries

  let successCount = 0;
  for (const row of routeRows) {
    const { error } = await client.from("routes").upsert([row], { onConflict: ["user_id", "wahoo_route_id"] });
    if (error) {
      console.error("Error upserting route:", error, "Data:", JSON.stringify(row));
    } else {
      successCount++;
    }
  }

  console.log(`Successfully upserted ${successCount}/${routeRows.length} routes for user:`, user_id);
  return routeRows.length;
}
