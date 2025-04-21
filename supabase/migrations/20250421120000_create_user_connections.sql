
-- Create table for storing third-party API connections
CREATE TABLE IF NOT EXISTS public.user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Composite unique constraint to ensure one connection per provider per user
  UNIQUE(user_id, provider)
);

-- Add RLS policies
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- Users can only view their own connections
CREATE POLICY "Users can view their own connections" 
  ON public.user_connections
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Only authenticated users can insert their own connections
CREATE POLICY "Users can insert their own connections" 
  ON public.user_connections
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can update their own connections
CREATE POLICY "Users can update their own connections" 
  ON public.user_connections
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Only authenticated users can delete their own connections
CREATE POLICY "Users can delete their own connections" 
  ON public.user_connections
  FOR DELETE 
  USING (auth.uid() = user_id);
