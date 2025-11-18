-- RevenueCat Integration Setup for Supabase
-- This extends your existing database with RevenueCat webhook handling

-- Create table for RevenueCat webhook events
CREATE TABLE IF NOT EXISTS revenuecat_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  app_user_id TEXT,
  original_app_user_id TEXT,
  product_id TEXT,
  entitlement_id TEXT,
  transaction_id TEXT,
  original_transaction_id TEXT,
  purchase_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  is_trial_period BOOLEAN DEFAULT FALSE,
  auto_renewing BOOLEAN DEFAULT TRUE,
  store TEXT, -- 'app_store' or 'play_store'
  environment TEXT, -- 'SANDBOX' or 'PRODUCTION'
  raw_event JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_revenuecat_events_app_user_id ON revenuecat_events(app_user_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_events_event_type ON revenuecat_events(event_type);
CREATE INDEX IF NOT EXISTS idx_revenuecat_events_product_id ON revenuecat_events(product_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_events_created_at ON revenuecat_events(created_at);

-- Update user_profiles table to include subscription info
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS revenuecat_user_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_product_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_trial_period BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_renewing BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS original_transaction_id TEXT;

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_revenuecat_user_id ON user_profiles(revenuecat_user_id);

-- Function to handle RevenueCat webhook events
CREATE OR REPLACE FUNCTION handle_revenuecat_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user subscription status based on event type
  IF NEW.event_type IN ('INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE') THEN
    -- User has active subscription
    UPDATE user_profiles 
    SET 
      subscription_status = 'premium',
      subscription_product_id = NEW.product_id,
      subscription_expires_at = NEW.expiration_date,
      is_trial_period = NEW.is_trial_period,
      auto_renewing = NEW.auto_renewing,
      original_transaction_id = NEW.original_transaction_id,
      revenuecat_user_id = NEW.app_user_id,
      updated_at = NOW()
    WHERE id::text = NEW.app_user_id OR revenuecat_user_id = NEW.app_user_id;
    
  ELSIF NEW.event_type IN ('CANCELLATION', 'EXPIRATION') THEN
    -- User subscription ended
    UPDATE user_profiles 
    SET 
      subscription_status = 'free',
      subscription_product_id = NULL,
      subscription_expires_at = NULL,
      is_trial_period = FALSE,
      auto_renewing = FALSE,
      updated_at = NOW()
    WHERE id::text = NEW.app_user_id OR revenuecat_user_id = NEW.app_user_id;
    
  ELSIF NEW.event_type = 'UNCANCELLATION' THEN
    -- User reactivated subscription
    UPDATE user_profiles 
    SET 
      subscription_status = 'premium',
      auto_renewing = TRUE,
      updated_at = NOW()
    WHERE id::text = NEW.app_user_id OR revenuecat_user_id = NEW.app_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for RevenueCat webhook events
DROP TRIGGER IF EXISTS trigger_handle_revenuecat_webhook ON revenuecat_events;
CREATE TRIGGER trigger_handle_revenuecat_webhook
  AFTER INSERT ON revenuecat_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_revenuecat_webhook();

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_id UUID)
RETURNS TABLE (
  is_premium BOOLEAN,
  subscription_product_id TEXT,
  expires_at TIMESTAMPTZ,
  is_trial BOOLEAN,
  auto_renewing BOOLEAN,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN up.subscription_status = 'premium' AND 
           (up.subscription_expires_at IS NULL OR up.subscription_expires_at > NOW())
      THEN TRUE 
      ELSE FALSE 
    END as is_premium,
    up.subscription_product_id,
    up.subscription_expires_at as expires_at,
    up.is_trial_period as is_trial,
    up.auto_renewing,
    CASE 
      WHEN up.subscription_expires_at IS NOT NULL 
      THEN EXTRACT(DAY FROM (up.subscription_expires_at - NOW()))::INTEGER
      ELSE NULL 
    END as days_remaining
  FROM user_profiles up
  WHERE up.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for revenuecat_events table
ALTER TABLE revenuecat_events ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert webhook events
CREATE POLICY "Service role can insert webhook events" ON revenuecat_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Users can view their own events
CREATE POLICY "Users can view own events" ON revenuecat_events
  FOR SELECT USING (
    app_user_id = auth.uid()::text OR 
    original_app_user_id = auth.uid()::text
  );

-- Grant necessary permissions
GRANT SELECT ON revenuecat_events TO authenticated;
GRANT INSERT ON revenuecat_events TO service_role;
GRANT EXECUTE ON FUNCTION get_user_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_revenuecat_webhook() TO service_role;

-- Create view for subscription analytics
CREATE OR REPLACE VIEW subscription_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  event_type,
  product_id,
  store,
  environment,
  COUNT(*) as event_count,
  COUNT(DISTINCT app_user_id) as unique_users
FROM revenuecat_events
GROUP BY DATE_TRUNC('day', created_at), event_type, product_id, store, environment
ORDER BY date DESC;

-- Grant access to analytics view
GRANT SELECT ON subscription_analytics TO authenticated;

COMMENT ON TABLE revenuecat_events IS 'Stores RevenueCat webhook events for subscription management';
COMMENT ON FUNCTION get_user_subscription_status(UUID) IS 'Returns current subscription status for a user';
COMMENT ON FUNCTION handle_revenuecat_webhook() IS 'Processes RevenueCat webhook events and updates user subscription status';
COMMENT ON VIEW subscription_analytics IS 'Provides subscription analytics and metrics';