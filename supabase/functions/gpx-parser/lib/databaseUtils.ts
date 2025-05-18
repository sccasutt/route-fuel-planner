
// Helper function to store route points in the database
export async function storeRoutePoints(
  client: any,
  routeId: string,
  points: Array<{
    lat: number;
    lng: number;
    elevation: number | null;
    timestamp: string | null;
  }>
): Promise<number> {
  if (!points || points.length === 0) {
    console.log("No points to store for route", routeId);
    return 0;
  }
  
  console.log(`Storing ${points.length} points for route ${routeId}`);
  
  try {
    // First delete any existing points for this route to avoid duplicates
    console.log(`Removing any existing points for route ${routeId}`);
    const { error: deleteError } = await client
      .from('route_points')
      .delete()
      .eq('route_id', routeId);
      
    if (deleteError) {
      console.error("Error deleting existing route points:", deleteError);
      // Continue with insertion attempt even if deletion fails
    } else {
      console.log("Successfully cleared any existing route points");
    }
    
    // Process in batches to avoid potential size limits
    const batchSize = 50; // Smaller batch size for more reliable processing
    let insertedCount = 0;
    
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      const values = batch.map((point, index) => ({
        route_id: routeId,
        sequence_index: i + index,
        lat: point.lat,
        lng: point.lng,
        elevation: point.elevation,
        recorded_at: point.timestamp ? new Date(point.timestamp).toISOString() : null
      }));
      
      console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(points.length / batchSize)} with ${batch.length} points`);
      
      // Log sample points for debugging
      if (values.length > 0) {
        console.log(`Sample point [0]: lat=${values[0].lat}, lng=${values[0].lng}, ele=${values[0].elevation}`);
        if (values.length > 1) {
          const last = values[values.length - 1];
          console.log(`Sample point [last]: lat=${last.lat}, lng=${last.lng}, ele=${last.elevation}`);
        }
      }
      
      const { data, error } = await client
        .from('route_points')
        .insert(values);
      
      if (error) {
        console.error("Error storing route points batch:", error);
        throw error;
      }
      
      insertedCount += batch.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} successfully. Total: ${insertedCount}`);
    }
    
    console.log(`Successfully stored ${insertedCount} route points for route ${routeId}`);
    return insertedCount;
  } catch (error) {
    console.error("Error in storeRoutePoints:", error);
    throw error;
  }
}
