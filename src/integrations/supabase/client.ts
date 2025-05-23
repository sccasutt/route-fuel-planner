
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://jxouzttcjpmmtclagbob.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4b3V6dHRjanBtbXRjbGFnYm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMjEwOTcsImV4cCI6MjA2MDc5NzA5N30.GkVo-nuaVJUKY_xR8TBT6saYVnaGBeVKJjPk-qDqoPk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: localStorage,
      // Configure auth to prevent redirect issues
      flowType: 'pkce',
      detectSessionInUrl: true,
      debug: true
    }
  }
);

// Add debug listener for auth events
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Supabase auth state changed:", event, session?.user?.id ? "User authenticated" : "No user");
  
  // Dispatch custom event for auth state changes to help with UI updates
  window.dispatchEvent(new CustomEvent('supabase-auth-change', { 
    detail: { event, session }
  }));
});

// Additional debugging for related issues
console.log("Supabase client initialized with options:", {
  domain: window.location.hostname,
  secure: window.location.protocol === 'https:',
  url: window.location.href
});
