-- Subscription Tables for Glow App
-- Run these queries in your Supabase SQL Editor after running the main supabase-setup.sql

-- 1. Create subscriptions table to track user subscription status
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  product_id TEXT NOT NULL, -- e.g., 'glow_premium_monthly', 'glow_premium_yearly'
  transaction_id TEXT UNIQUE, -- App Store/Play Store transaction ID
  original_transaction_id TEXT, -- For renewals
  purchase_token TEXT, -- Play Store purchase token
  receipt_data TEXT, -- App Store receipt data
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending', 'grace_period', 'on_hold')),
  expires_at TIMESTAMP WITH TIME ZONE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  auto_renew BOOLEAN DEFAULT TRUE,
  is_trial BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. Create subscription_events table to track subscription lifecycle events
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('purchase', 'renewal', 'cancellation', 'expiration', 'refund', 'trial_start', 'trial_end', 'grace_period_start', 'grace_period_end')),
  platform_data JSONB, -- Raw data from App Store/Play Store
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on subscription_events table
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription_events
CREATE POLICY "Users can view own subscription events" ON public.subscription_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription events" ON public.subscription_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Create usage_tracking table to track feature usage and limits
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('glow_analysis', 'style_analysis', 'skincare_plan', 'ai_coach')),
  usage_count INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_type)
);

-- Enable RLS on usage_tracking table
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for usage_tracking
CREATE POLICY "Users can view own usage tracking" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage tracking" ON public.usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage tracking" ON public.usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Create trial_tracking table to track free trial usage
CREATE TABLE IF NOT EXISTS public.trial_tracking (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 days'),
  analyses_used INTEGER DEFAULT 0,
  max_analyses INTEGER DEFAULT 3,
  is_trial_expired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on trial_tracking table
ALTER TABLE public.trial_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for trial_tracking
CREATE POLICY "Users can view own trial tracking" ON public.trial_tracking
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own trial tracking" ON public.trial_tracking
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own trial tracking" ON public.trial_tracking
  FOR UPDATE USING (auth.uid() = id);

-- 5. Update the handle_new_user function to include trial tracking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_stats (id)
  VALUES (NEW.id);
  
  INSERT INTO public.trial_tracking (id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  active_sub_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO active_sub_count
  FROM public.subscriptions
  WHERE user_id = user_uuid
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN active_sub_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to check if user is in trial period
CREATE OR REPLACE FUNCTION public.is_in_trial_period(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  trial_valid BOOLEAN := FALSE;
BEGIN
  SELECT (trial_ends_at > NOW() AND NOT is_trial_expired)
  INTO trial_valid
  FROM public.trial_tracking
  WHERE id = user_uuid;
  
  RETURN COALESCE(trial_valid, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_usage(user_uuid UUID, feature TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, feature_type, usage_count, last_reset_date)
  VALUES (user_uuid, feature, 1, CURRENT_DATE)
  ON CONFLICT (user_id, feature_type)
  DO UPDATE SET
    usage_count = CASE
      WHEN usage_tracking.last_reset_date < CURRENT_DATE THEN 1
      ELSE usage_tracking.usage_count + 1
    END,
    last_reset_date = CURRENT_DATE,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to increment trial usage
CREATE OR REPLACE FUNCTION public.increment_trial_usage(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.trial_tracking
  SET 
    analyses_used = analyses_used + 1,
    is_trial_expired = CASE
      WHEN analyses_used + 1 >= max_analyses OR NOW() > trial_ends_at THEN TRUE
      ELSE FALSE
    END,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to update subscription status
CREATE OR REPLACE FUNCTION public.update_subscription_status(
  user_uuid UUID,
  new_status TEXT,
  new_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.subscriptions
  SET 
    status = new_status,
    expires_at = COALESCE(new_expires_at, expires_at),
    updated_at = NOW()
  WHERE user_id = user_uuid
    AND status = 'active';
    
  -- Update profile premium status
  UPDATE public.profiles
  SET 
    is_premium = CASE
      WHEN new_status = 'active' THEN TRUE
      ELSE FALSE
    END,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create triggers for updated_at columns
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trial_tracking_updated_at
  BEFORE UPDATE ON public.trial_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON public.subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id ON public.subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_feature ON public.usage_tracking(user_id, feature_type);
CREATE INDEX IF NOT EXISTS idx_trial_tracking_expires ON public.trial_tracking(trial_ends_at);

-- 13. Create view for user subscription status
CREATE OR REPLACE VIEW public.user_subscription_status AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.is_premium,
  s.status as subscription_status,
  s.expires_at as subscription_expires_at,
  s.is_trial as is_subscription_trial,
  t.trial_ends_at,
  t.analyses_used,
  t.max_analyses,
  t.is_trial_expired,
  public.has_active_subscription(p.id) as has_active_subscription,
  public.is_in_trial_period(p.id) as is_in_trial_period
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id AND s.status = 'active'
LEFT JOIN public.trial_tracking t ON p.id = t.id;

-- Setup complete!
-- Your subscription system is now ready for the Glow app.