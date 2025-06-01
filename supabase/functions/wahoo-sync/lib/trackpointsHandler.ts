
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

  // First check if the trackpoints table exists
  try {
    const { error: tableCheckError } = await client
      .from('trackpoints')
      .select('route_id')
      .limit(1);

    if (tableCheckError) {
      console.error('Error checking trackpoints table:', tableCheckError);
      console.error('The trackpoints table may not exist - you need to create it first!');
      return 0;
    }
  } catch (tableErr) {
    console.error('Exception checking trackpoints table:', tableErr);
    return 0;
  }

  // Format trackpoints data for insertion with proper validation
  const formatted = trackpoints
    .filter((p) => {
      // Ensure we have valid lat/lon coordinates
      const hasLat = p.lat !== undefined && p.lat !== null && !isNaN(Number(p.lat));
      const hasLon = (p.lon !== undefined && p.lon !== null && !isNaN(Number(p.lon))) || 
                     (p.lng !== undefined && p.lng !== null && !isNaN(Number(p.lng)));
      return hasLat && hasLon;
    })
    .map((p) => ({
      route_id: routeId,
      time: p.time || p.timestamp || null,
      lat: Number(p.lat),
      lon: Number(p.lon || p.lng), // Support both lon and lng property names
      elevation: p.elevation !== undefined && p.elevation !== null ? Number(p.elevation) : 
                 p.ele !== undefined && p.ele !== null ? Number(p.ele) : 
                 p.alt !== undefined && p.alt !== null ? Number(p.alt) : null,
      power: p.power !== undefined && p.power !== null ? Number(p.power) : 
             p.watts !== undefined && p.watts !== null ? Number(p.watts) : null,
      heart_rate: p.heart_rate !== undefined && p.heart_rate !== null ? Number(p.heart_rate) : 
                  p.hr !== undefined && p.hr !== null ? Number(p.hr) : null,
      cadence: p.cadence !== undefined && p.cadence !== null ? Number(p.cadence) : null
    }));

  if (formatted.length === 0) {
    console.warn(`No valid trackpoints to insert for route ${routeId} after filtering`);
    return 0;
  }

  // Log sample data to help debug
  console.log(`Filtered ${formatted.length} valid trackpoints from ${trackpoints.length} original points`);
  console.log('Sample trackpoint data:', JSON.stringify(formatted[0]));

  try {
    // Process in smaller batches to avoid payload size limits
    const batchSize = 50; 
    let insertedCount = 0;

    for (let i = 0; i < formatted.length; i += batchSize) {
      const batch = formatted.slice(i, i + batchSize);
      
      console.log(`Inserting batch ${i/batchSize + 1} with ${batch.length} trackpoints`);
      
      const { data, error } = await client
        .from("trackpoints")
        .insert(batch)
        .select('id');
      
      if (error) {
        console.error(`Failed to insert trackpoints batch ${i/batchSize + 1}:`, error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // More detailed error info
        if (error.message.includes('does not exist')) {
          console.error('The trackpoints table does not exist');
        } else if (error.message.includes('violates foreign key constraint')) {
          console.error(`Invalid route ID: ${routeId}`);
        } else if (error.message.includes('missing required column')) {
          console.error('Schema mismatch - check column requirements');
        }
        
        // Continue with other batches even if one fails
        continue;
      } else {
        insertedCount += batch.length;
        console.log(`Successfully inserted batch ${i/batchSize + 1}: ${batch.length} trackpoints, first ID: ${data?.[0]?.id}`);
      }
    }

    console.log(`Successfully inserted ${insertedCount} trackpoints for route ${routeId}`);
    return insertedCount;
  } catch (err) {
    console.error(`Error inserting trackpoints for route ${routeId}:`, err);
    return 0;
  }
}
