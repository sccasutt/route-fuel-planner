
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * Insert trackpoints for a specific route with enhanced error handling and logging
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
    console.warn(`No trackpoints to insert for route ${routeId} (${trackpoints?.length || 0} trackpoints)`);
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

  // Format trackpoints data for insertion with enhanced validation
  const formatted = trackpoints
    .filter((p, index) => {
      // Ensure we have valid lat/lon coordinates
      const hasLat = p.lat !== undefined && p.lat !== null && !isNaN(Number(p.lat));
      const hasLon = (p.lon !== undefined && p.lon !== null && !isNaN(Number(p.lon))) || 
                     (p.lng !== undefined && p.lng !== null && !isNaN(Number(p.lng)));
      
      const latValid = hasLat && Number(p.lat) >= -90 && Number(p.lat) <= 90;
      const lonValid = hasLon && Number(p.lon || p.lng) >= -180 && Number(p.lon || p.lng) <= 180;
      
      if (!latValid || !lonValid) {
        if (index < 5) { // Only log first few invalid points to avoid spam
          console.log(`Filtering out invalid trackpoint ${index}:`, {
            lat: p.lat,
            lon: p.lon || p.lng,
            hasLat,
            hasLon,
            latValid,
            lonValid
          });
        }
        return false;
      }
      
      return true;
    })
    .map((p, index) => ({
      route_id: routeId,
      time: parseTrackpointTime(p.time || p.timestamp),
      lat: Number(p.lat),
      lon: Number(p.lon || p.lng), // Support both lon and lng property names
      elevation: parseNumericValue(p.elevation || p.ele || p.alt),
      power: parseNumericValue(p.power || p.watts),
      heart_rate: parseNumericValue(p.heart_rate || p.hr),
      cadence: parseNumericValue(p.cadence)
    }));

  if (formatted.length === 0) {
    console.warn(`No valid trackpoints to insert for route ${routeId} after filtering`);
    return 0;
  }

  // Log sample data to help debug
  console.log(`Filtered ${formatted.length} valid trackpoints from ${trackpoints.length} original points`);
  console.log('Sample trackpoint data:', JSON.stringify(formatted[0], null, 2));

  // Log data quality statistics
  const stats = calculateDataQuality(formatted);
  console.log('Data quality stats:', stats);

  try {
    // Process in smaller batches to avoid payload size limits
    const batchSize = 50; 
    let insertedCount = 0;

    for (let i = 0; i < formatted.length; i += batchSize) {
      const batch = formatted.slice(i, i + batchSize);
      
      console.log(`Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(formatted.length/batchSize)} with ${batch.length} trackpoints`);
      
      const { data, error } = await client
        .from("trackpoints")
        .insert(batch)
        .select('id');
      
      if (error) {
        console.error(`Failed to insert trackpoints batch ${Math.floor(i/batchSize) + 1}:`, error);
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
        console.log(`Successfully inserted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} trackpoints`);
        
        if (data && data.length > 0) {
          console.log(`First inserted trackpoint ID: ${data[0].id}`);
        }
      }
    }

    console.log(`Successfully inserted ${insertedCount}/${formatted.length} trackpoints for route ${routeId}`);
    return insertedCount;
  } catch (err) {
    console.error(`Error inserting trackpoints for route ${routeId}:`, err);
    return 0;
  }
}

/**
 * Parse trackpoint time value with multiple format support
 */
function parseTrackpointTime(timeValue: any): string | null {
  if (!timeValue) return null;
  
  try {
    // If it's already a valid ISO string
    if (typeof timeValue === 'string') {
      const date = new Date(timeValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    // If it's a number (Unix timestamp)
    if (typeof timeValue === 'number') {
      // Check if it's in seconds or milliseconds
      const timestamp = timeValue > 1e10 ? timeValue : timeValue * 1000;
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Error parsing trackpoint time:', timeValue, error);
    return null;
  }
}

/**
 * Parse numeric value with validation
 */
function parseNumericValue(value: any): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  return num;
}

/**
 * Calculate data quality statistics
 */
function calculateDataQuality(trackpoints: any[]): any {
  if (trackpoints.length === 0) {
    return { totalPoints: 0 };
  }
  
  const stats = {
    totalPoints: trackpoints.length,
    withElevation: 0,
    withPower: 0,
    withHeartRate: 0,
    withCadence: 0,
    withTime: 0,
    avgLat: 0,
    avgLon: 0,
    latRange: [Infinity, -Infinity],
    lonRange: [Infinity, -Infinity]
  };
  
  let latSum = 0;
  let lonSum = 0;
  
  trackpoints.forEach(tp => {
    if (tp.elevation !== null) stats.withElevation++;
    if (tp.power !== null) stats.withPower++;
    if (tp.heart_rate !== null) stats.withHeartRate++;
    if (tp.cadence !== null) stats.withCadence++;
    if (tp.time !== null) stats.withTime++;
    
    latSum += tp.lat;
    lonSum += tp.lon;
    
    stats.latRange[0] = Math.min(stats.latRange[0], tp.lat);
    stats.latRange[1] = Math.max(stats.latRange[1], tp.lat);
    stats.lonRange[0] = Math.min(stats.lonRange[0], tp.lon);
    stats.lonRange[1] = Math.max(stats.lonRange[1], tp.lon);
  });
  
  stats.avgLat = latSum / trackpoints.length;
  stats.avgLon = lonSum / trackpoints.length;
  
  return stats;
}
