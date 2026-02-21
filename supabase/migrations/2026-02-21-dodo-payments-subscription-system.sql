-- ============================================================================
-- DODO PAYMENTS SUBSCRIPTION SYSTEM
-- Migration for subscription plans and usage tracking
-- ============================================================================

-- Drop existing subscription plan enum if it exists and recreate with correct values
DROP TYPE IF EXISTS subscription_plan CASCADE;
CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'intermediate', 'advanced');

-- ============================================================================
-- SUBSCRIPTION PLANS TABLE
-- Defines available subscription plans with pricing and limits
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_name subscription_plan NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    quick_reflect_limit INTEGER NOT NULL,
    deep_reflect_limit INTEGER NOT NULL,
    therapist_sessions_per_week INTEGER NOT NULL,
    description TEXT,
    features TEXT[],
    is_active BOOLEAN DEFAULT true,
    dodo_product_id TEXT, -- Dodo Payments product ID (NULL for free plan)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default plans (including free plan)
INSERT INTO subscription_plans (plan_name, display_name, price_monthly, price_yearly, quick_reflect_limit, deep_reflect_limit, therapist_sessions_per_week, description, features, dodo_product_id) VALUES
('free', 'Free', 0.00, 0.00, 0, 0, 0, 'Start your mental health journey with basic journaling', ARRAY[
    'Unlimited journal entries',
    'View your entries anytime',
    'Basic mental health tracking',
    'No AI features included'
], NULL),
('basic', 'Basic', 9.99, 99.99, 15, 5, 2, 'Perfect for getting started with mental health tracking', ARRAY[
    'Write journal entries and reflect for the whole month',
    '15 requests of quick reflect',
    '5 requests of deep reflect',
    'Monthly wrap report',
    'Therapist included - 2 sessions per week'
], NULL),
('intermediate', 'Intermediate', 19.99, 199.99, 25, 10, 3, 'Great for consistent mental health practice', ARRAY[
    'Write journal entries and reflect for the whole month',
    '25 requests of quick reflect',
    '10 requests of deep reflect',
    'Monthly wrap report',
    'Therapist included - 3 sessions per week'
], NULL),
('advanced', 'Advanced', 29.99, 299.99, 30, 15, 4, 'Comprehensive support for your mental health journey', ARRAY[
    'Write journal entries and reflect for the whole month',
    '30 requests of quick reflect',
    '15 requests of deep reflect',
    'Monthly wrap report',
    'Therapist included - 4 sessions per week'
], NULL);

-- ============================================================================
-- USER SUBSCRIPTIONS TABLE
-- Tracks active subscriptions for users
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_name subscription_plan NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired, on_hold
    
    -- Dodo Payments integration
    dodo_subscription_id TEXT UNIQUE,
    dodo_customer_id TEXT,
    dodo_payment_id TEXT,
    
    -- Subscription dates
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Pricing
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    billing_cycle TEXT DEFAULT 'monthly', -- monthly, yearly
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    CONSTRAINT fk_plan FOREIGN KEY (plan_name) REFERENCES subscription_plans(plan_name)
);

-- Index for fast user subscription lookup
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_dodo_id ON user_subscriptions(dodo_subscription_id);

-- ============================================================================
-- USAGE TRACKING TABLE
-- Tracks usage of quick_reflect, deep_reflect, and therapist sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    
    -- Reset monthly
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Usage counters
    quick_reflect_used INTEGER DEFAULT 0,
    deep_reflect_used INTEGER DEFAULT 0,
    therapist_sessions_used INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Ensure one usage tracking record per user per period
    UNIQUE(user_id, period_start)
);

-- Index for fast usage lookup
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- ============================================================================
-- PAYMENT HISTORY TABLE
-- Records all payments made through Dodo Payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    
    -- Dodo Payments data
    dodo_payment_id TEXT UNIQUE NOT NULL,
    dodo_customer_id TEXT,
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL, -- succeeded, failed, processing, cancelled
    payment_method TEXT,
    
    -- Metadata
    description TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for payment lookup
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_dodo_payment_id ON payment_history(dodo_payment_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get current subscription for a user
CREATE OR REPLACE FUNCTION get_current_subscription(p_user_id UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_name subscription_plan,
    status TEXT,
    current_period_end TIMESTAMP WITH TIME ZONE,
    quick_reflect_limit INTEGER,
    deep_reflect_limit INTEGER,
    therapist_sessions_per_week INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.plan_name,
        us.status,
        us.current_period_end,
        sp.quick_reflect_limit,
        sp.deep_reflect_limit,
        sp.therapist_sessions_per_week
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_name = sp.plan_name
    WHERE us.user_id = p_user_id
        AND us.status = 'active'
        AND us.current_period_end > NOW()
    ORDER BY us.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create usage tracking for current period
CREATE OR REPLACE FUNCTION get_or_create_usage_tracking(p_user_id UUID, p_subscription_id UUID)
RETURNS UUID AS $$
DECLARE
    v_usage_id UUID;
    v_period_start TIMESTAMP WITH TIME ZONE;
    v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current period from subscription
    SELECT current_period_start, current_period_end 
    INTO v_period_start, v_period_end
    FROM user_subscriptions
    WHERE id = p_subscription_id;
    
    -- Try to get existing usage tracking
    SELECT id INTO v_usage_id
    FROM usage_tracking
    WHERE user_id = p_user_id 
        AND period_start = v_period_start
        AND period_end = v_period_end;
    
    -- Create if doesn't exist
    IF v_usage_id IS NULL THEN
        INSERT INTO usage_tracking (user_id, subscription_id, period_start, period_end)
        VALUES (p_user_id, p_subscription_id, v_period_start, v_period_end)
        RETURNING id INTO v_usage_id;
    END IF;
    
    RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can use a feature
CREATE OR REPLACE FUNCTION can_use_feature(
    p_user_id UUID,
    p_feature TEXT -- 'quick_reflect', 'deep_reflect', 'therapist_session'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_subscription_id UUID;
    v_usage_id UUID;
    v_current_usage INTEGER;
    v_limit INTEGER;
BEGIN
    -- Get current subscription
    SELECT subscription_id INTO v_subscription_id
    FROM get_current_subscription(p_user_id);
    
    IF v_subscription_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get or create usage tracking
    v_usage_id := get_or_create_usage_tracking(p_user_id, v_subscription_id);
    
    -- Check usage based on feature
    IF p_feature = 'quick_reflect' THEN
        SELECT ut.quick_reflect_used, sp.quick_reflect_limit
        INTO v_current_usage, v_limit
        FROM usage_tracking ut
        JOIN user_subscriptions us ON ut.subscription_id = us.id
        JOIN subscription_plans sp ON us.plan_name = sp.plan_name
        WHERE ut.id = v_usage_id;
        
    ELSIF p_feature = 'deep_reflect' THEN
        SELECT ut.deep_reflect_used, sp.deep_reflect_limit
        INTO v_current_usage, v_limit
        FROM usage_tracking ut
        JOIN user_subscriptions us ON ut.subscription_id = us.id
        JOIN subscription_plans sp ON us.plan_name = sp.plan_name
        WHERE ut.id = v_usage_id;
        
    ELSIF p_feature = 'therapist_session' THEN
        SELECT ut.therapist_sessions_used, sp.therapist_sessions_per_week
        INTO v_current_usage, v_limit
        FROM usage_tracking ut
        JOIN user_subscriptions us ON ut.subscription_id = us.id
        JOIN subscription_plans sp ON us.plan_name = sp.plan_name
        WHERE ut.id = v_usage_id;
    ELSE
        RETURN FALSE;
    END IF;
    
    RETURN v_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_feature TEXT -- 'quick_reflect', 'deep_reflect', 'therapist_session'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_subscription_id UUID;
    v_usage_id UUID;
    v_can_use BOOLEAN;
BEGIN
    -- Check if user can use feature
    v_can_use := can_use_feature(p_user_id, p_feature);
    
    IF NOT v_can_use THEN
        RETURN FALSE;
    END IF;
    
    -- Get subscription and usage tracking
    SELECT subscription_id INTO v_subscription_id
    FROM get_current_subscription(p_user_id);
    
    v_usage_id := get_or_create_usage_tracking(p_user_id, v_subscription_id);
    
    -- Increment usage
    IF p_feature = 'quick_reflect' THEN
        UPDATE usage_tracking
        SET quick_reflect_used = quick_reflect_used + 1,
            updated_at = NOW()
        WHERE id = v_usage_id;
        
    ELSIF p_feature = 'deep_reflect' THEN
        UPDATE usage_tracking
        SET deep_reflect_used = deep_reflect_used + 1,
            updated_at = NOW()
        WHERE id = v_usage_id;
        
    ELSIF p_feature = 'therapist_session' THEN
        UPDATE usage_tracking
        SET therapist_sessions_used = therapist_sessions_used + 1,
            updated_at = NOW()
        WHERE id = v_usage_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Subscription plans - public read
CREATE POLICY "Anyone can view active subscription plans"
    ON subscription_plans FOR SELECT
    USING (is_active = true);

-- User subscriptions - users can view their own
CREATE POLICY "Users can view their own subscriptions"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Admin can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
    ON user_subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Usage tracking - users can view their own
CREATE POLICY "Users can view their own usage"
    ON usage_tracking FOR SELECT
    USING (auth.uid() = user_id);

-- Payment history - users can view their own
CREATE POLICY "Users can view their own payment history"
    ON payment_history FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATE EXISTING user_profiles TABLE
-- ============================================================================

-- Add new columns to user_profiles if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_profiles' AND column_name='dodo_customer_id') THEN
        ALTER TABLE user_profiles ADD COLUMN dodo_customer_id TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_profiles' AND column_name='subscription_plan') THEN
        ALTER TABLE user_profiles ADD COLUMN subscription_plan subscription_plan DEFAULT 'free';
    END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_profiles_dodo_customer_id ON user_profiles(dodo_customer_id);

-- ============================================================================
-- TRIGGER: Auto-assign free plan to new users
-- ============================================================================
CREATE OR REPLACE FUNCTION assign_free_plan_to_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a free subscription for the new user
    INSERT INTO user_subscriptions (
        user_id,
        subscription_plan_id,
        status,
        started_at
    )
    SELECT 
        NEW.id,
        sp.id,
        'active',
        NOW()
    FROM subscription_plans sp
    WHERE sp.plan_name = 'free'
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table to auto-assign free plan
DROP TRIGGER IF EXISTS trigger_assign_free_plan ON profiles;
CREATE TRIGGER trigger_assign_free_plan
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION assign_free_plan_to_new_user();
