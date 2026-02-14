-- Migration: Enhanced Skin Analysis Storage
-- This updates glow_analyses table to store complete skin analysis results
-- Run this in your Supabase SQL Editor

-- Add new columns to glow_analyses table to match AnalysisResult interface
ALTER TABLE public.glow_analyses
ADD COLUMN IF NOT EXISTS rating TEXT,
ADD COLUMN IF NOT EXISTS skin_potential TEXT,
ADD COLUMN IF NOT EXISTS skin_quality TEXT,
ADD COLUMN IF NOT EXISTS skin_tone TEXT,
ADD COLUMN IF NOT EXISTS skin_type TEXT,
ADD COLUMN IF NOT EXISTS detailed_scores JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dermatology_insights JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS personalized_tips JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS timestamp BIGINT;

-- Update existing records to use overall_score as the main score
-- (This ensures backward compatibility)
UPDATE public.glow_analyses
SET 
  detailed_scores = jsonb_build_object(
    'brightnessGlow', COALESCE(skin_score, overall_score),
    'hydrationLevel', COALESCE(skin_score, overall_score),
    'overallScore', overall_score
  ),
  timestamp = EXTRACT(EPOCH FROM created_at)::BIGINT * 1000
WHERE detailed_scores = '{}'::jsonb;

-- Create index for timestamp queries (for sorting by latest)
CREATE INDEX IF NOT EXISTS idx_glow_analyses_timestamp 
ON public.glow_analyses(user_id, timestamp DESC NULLS LAST);

-- Create index for detailed scores queries
CREATE INDEX IF NOT EXISTS idx_glow_analyses_detailed_scores 
ON public.glow_analyses USING GIN(detailed_scores);

-- Add comment for documentation
COMMENT ON COLUMN public.glow_analyses.detailed_scores IS 'Stores detailed skin analysis scores: brightnessGlow, hydrationLevel, skinTexture, etc.';
COMMENT ON COLUMN public.glow_analyses.dermatology_insights IS 'Stores dermatology insights: acneRisk, agingSigns, skinConcerns, recommendedTreatments';
COMMENT ON COLUMN public.glow_analyses.personalized_tips IS 'Array of personalized skincare tips';
COMMENT ON COLUMN public.glow_analyses.timestamp IS 'Unix timestamp in milliseconds for client-side sorting';


