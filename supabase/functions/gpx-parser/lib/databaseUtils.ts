
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
    // Process in batches to avoid potential size limits
    const batchSize = 100;
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
      
      console.log(`Inserting batch ${Math.floor(i / batchSize) + 1} with ${batch.length} points`);
      
      const { data, error } = await client
        .from('route_points')
        .upsert(values, { 
          onConflict: 'route_id,sequence_index',
          ignoreDuplicates: false 
        });
      
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
