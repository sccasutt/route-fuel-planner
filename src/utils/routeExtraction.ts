
import { supabase } from "@/integrations/supabase/client";

/**
 * Extract route points from existing route data and store them in the route_points table
 */
export async function extractAndStoreRoutePoints(routeId: string): Promise<boolean> {
  try {
    console.log(`Starting point extraction for route: ${routeId}`);
    
    // Fetch route data
    const { data: routeData, error: routeError } = await supabase
      .from('routes')
      .select('*')
      .eq('id', routeId)
      .single();
      
    if (routeError || !routeData) {
      console.error("Error fetching route for points extraction:", routeError);
      return false;
    }
    
    console.log(`Route data fetched: ${routeData.name}, checking for coordinates...`);
    
    // First check if points already exist
    const { count, error: countError } = await supabase
      .from('route_points')
      .select('id', { count: 'exact', head: true })
      .eq('route_id', routeId);
      
    if (!countError && count && count > 0) {
      console.log(`Route ${routeId} already has ${count} points, skipping extraction`);
      return true; // Points already exist
    }
    
    // Extract coordinates
    let coordinates: any[] = [];
    
    // Try to get coordinates from the coordinates field
    if (routeData.coordinates) {
      try {
        const parsedCoords = typeof routeData.coordinates === 'string' 
          ? JSON.parse(routeData.coordinates) 
          : routeData.coordinates;
          
        if (Array.isArray(parsedCoords)) {
          coordinates = parsedCoords;
          console.log(`Found ${coordinates.length} coordinates in coordinates field`);
        } else if (parsedCoords && typeof parsedCoords === 'object') {
          // Sometimes coordinates might be nested in an object
          const possibleArrays = Object.values(parsedCoords).filter(v => Array.isArray(v));
          if (possibleArrays.length > 0) {
            // Use the largest array found
            coordinates = possibleArrays.reduce((a, b) => a.length > b.length ? a : b);
            console.log(`Found ${coordinates.length} coordinates in nested object`);
          }
        }
      } catch (e) {
        console.error("Error parsing coordinates:", e);
      }
    }
    
    // If no coordinates, try to extract from gpx_data
    if ((!coordinates || coordinates.length < 2) && routeData.gpx_data) {
      console.log("Attempting to extract coordinates from gpx_data");
      try {
        const gpxData = typeof routeData.gpx_data === 'string'
          ? JSON.parse(routeData.gpx_data)
          : routeData.gpx_data;
        
        if (gpxData) {
          if (gpxData.coordinates && Array.isArray(gpxData.coordinates)) {
            coordinates = gpxData.coordinates;
            console.log(`Found ${coordinates.length} coordinates in gpx_data.coordinates`);
          } else if (gpxData.trackpoints && Array.isArray(gpxData.trackpoints)) {
            coordinates = gpxData.trackpoints.map((tp: any) => {
              const lat = tp.lat !== undefined ? tp.lat : tp.latitude;
              const lng = tp.lng !== undefined ? tp.lng : tp.longitude;
              const ele = tp.elevation || tp.ele || tp.alt || null;
              
              // Return as object if we need {lat, lng, elevation} format
              return { lat, lng, elevation: ele };
            }).filter((coord: any) => coord.lat && coord.lng);
            
            console.log(`Extracted ${coordinates.length} coordinates from gpx_data.trackpoints`);
          } else {
            // Try to find any array that might contain coordinates
            Object.keys(gpxData).forEach(key => {
              const value = gpxData[key];
              if (Array.isArray(value) && value.length > 0) {
                // Check if first element looks like a coordinate
                const sample = value[0];
                if ((sample.lat !== undefined || sample.latitude !== undefined) && 
                   (sample.lng !== undefined || sample.lon !== undefined || sample.longitude !== undefined)) {
                  coordinates = value.map((p: any) => {
                    const lat = p.lat !== undefined ? p.lat : p.latitude;
                    const lng = p.lng !== undefined ? p.lng : p.lon !== undefined ? p.lon : p.longitude;
                    const ele = p.elevation || p.ele || p.alt || null;
                    return { lat, lng, elevation: ele };
                  });
                  console.log(`Found ${coordinates.length} coordinates in gpx_data.${key}`);
                }
              }
            });
          }
        }
      } catch (e) {
        console.error("Error parsing gpx_data:", e);
      }
    }
    
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      console.log("No valid coordinates found for route:", routeId);
      return false;
    }
    
    console.log(`Processing ${coordinates.length} coordinates for insertion into route_points table`);
    
    // Delete existing points first to avoid duplicates
    const { error: deleteError } = await supabase
      .from('route_points')
      .delete()
      .eq('route_id', routeId);
      
    if (deleteError) {
      console.error("Error deleting existing route points:", deleteError);
      return false;
    }
    
    console.log("Successfully deleted any existing route points");
    
    // Process in batches to avoid size limits
    const batchSize = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < coordinates.length; i += batchSize) {
      const batch = coordinates.slice(i, i + batchSize);
      
      // Transform to route_points format
      const points = batch.map((coord: any, index: number) => {
        let lat, lng, elevation = null;
        let record: any = { route_id: routeId, sequence_index: i + index };
        
        if (Array.isArray(coord)) {
          lat = coord[0];
          lng = coord[1];
          elevation = coord.length > 2 ? coord[2] : null;
          record.lat = lat;
          record.lng = lng;
          record.elevation = elevation;
        } else if (typeof coord === 'object') {
          lat = coord.lat !== undefined ? coord.lat : coord.latitude;
          lng = coord.lng !== undefined ? coord.lng : coord.lon !== undefined ? coord.lon : coord.longitude;
          elevation = coord.elevation || coord.ele || coord.alt || null;
          
          record = {
            ...record,
            lat,
            lng,
            elevation,
            recorded_at: coord.time || coord.timestamp || null,
            power: coord.power || null,
            heart_rate: coord.heart_rate || coord.hr || null,
            cadence: coord.cadence || null
          };
        }
        
        return record;
      }).filter(point => 
        point.lat !== undefined && point.lng !== undefined
      );
      
      if (points.length === 0) continue;
      
      // Log a sample point for debugging
      if (i === 0) {
        console.log("Sample route point for insertion:", JSON.stringify(points[0]));
      }
      
      const { error } = await supabase
        .from('route_points')
        .insert(points);
        
      if (error) {
        console.error("Error inserting route points:", error);
      } else {
        totalInserted += points.length;
        console.log(`Inserted batch ${i/batchSize + 1}: ${points.length} points`);
      }
    }
    
    console.log(`Successfully inserted ${totalInserted} route points for route ${routeId}`);
    return totalInserted > 0;
  } catch (error) {
    console.error("Error in extractAndStoreRoutePoints:", error);
    return false;
  }
}
