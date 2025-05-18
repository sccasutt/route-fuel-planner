
// Function that handles inserting or updating profile and routes

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { upsertWahooProfile } from "./profileHandler.ts";
import { upsertRoutes } from "./routesHandler.ts";

// Re-export the main functions to maintain the existing API
export { upsertWahooProfile, upsertRoutes };
