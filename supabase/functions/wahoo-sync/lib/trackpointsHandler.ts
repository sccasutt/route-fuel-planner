
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * Insert trackpoints for a specific route
 * @param client Supabase client instance
 * @param routeId ID of the route to associate trackpoints with
 * @param trackpoints Array of trackpoint data
 * @returns Number of trackpoints inserted
 */
export async function insertTrackpointsForRoute(
  client: SupabaseClient,
  routeId: string,
  trackpoints: any[]
): Promise<number> {
  if (!routeId || !trackpoints?.length) {
    console.warn(`No trackpoints to insert for route ${routeId}`);
    return 0;
  }

  console.log(`Processing ${trackpoints.length} trackpoints for route ${routeId}`);

  const formatted = trackpoints
    .filter((p) => p.lat !== undefined && (p.lon !== undefined || p.lng !== undefined))
    .map((p) => ({
      route_id: routeId,
      time: p.time || p.timestamp || null,
      lat: p.lat,
      lon: p.lon || p.lng, // Support both lon and lng property names
      elevation: p.elevation || p.ele || p.alt || null,
      power: p.power || p.watts || null,
      heart_rate: p.heart_rate || p.hr || null,
      cadence: p.cadence || null
    }));

  if (formatted.length === 0) {
    console.warn(`No valid trackpoints to insert for route ${routeId}`);
    return 0;
  }

  try {
    // Process in batches to avoid payload size limits
    const batchSize = 100; 
    let insertedCount = 0;

    for (let i = 0; i < formatted.length; i += batchSize) {
      const batch = formatted.slice(i, i + batchSize);
      
      const { error } = await client.from("trackpoints").insert(batch);
      
      if (error) {
        console.error(`Failed to insert trackpoints batch ${i/batchSize + 1}:`, error);
      } else {
        insertedCount += batch.length;
        console.log(`Inserted ${batch.length} trackpoints for batch ${i/batchSize + 1}`);
      }
    }

    console.log(`Successfully inserted ${insertedCount} trackpoints for route ${routeId}`);
    return insertedCount;
  } catch (err) {
    console.error(`Error inserting trackpoints for route ${routeId}:`, err);
    return 0;
  }
}
