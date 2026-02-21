# Quick Start SQL Commands

## Run these SQL commands in your Supabase SQL Editor

### 1. Apply the main migration
```sql
-- Run the entire migration file:
-- supabase/migrations/2026-02-21-dodo-payments-subscription-system.sql
-- You can copy-paste the entire file contents into Supabase SQL Editor
```

### 2. After creating products in Dodo Dashboard, update product IDs

Replace `pdt_xxx` with your actual Dodo product IDs:

```sql
-- Update Basic plan product ID
UPDATE subscription_plans 
SET dodo_product_id = 'pdt_your_basic_product_id_here' 
WHERE plan_name = 'basic';

-- Update Intermediate plan product ID
UPDATE subscription_plans 
SET dodo_product_id = 'pdt_your_intermediate_product_id_here' 
WHERE plan_name = 'intermediate';

-- Update Advanced plan product ID
UPDATE subscription_plans 
SET dodo_product_id = 'pdt_your_advanced_product_id_here' 
WHERE plan_name = 'advanced';
```

### 3. Verify installation

```sql
-- Check subscription plans
SELECT * FROM subscription_plans;

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_current_subscription',
    'get_or_create_usage_tracking',
    'can_use_feature',
    'increment_usage'
);
```

### 4. Test functions (replace user_id with actual user ID after signup)

```sql
-- Test get current subscription
SELECT * FROM get_current_subscription('user-id-here');

-- Test can use feature
SELECT can_use_feature('user-id-here', 'quick_reflect');

-- Test increment usage (only after subscription is active)
SELECT increment_usage('user-id-here', 'quick_reflect');
```

## Environment Variables to Set

Create `.env.local` file with these variables:

```bash
# Required for Dodo Payments
DODO_PAYMENTS_API_KEY=sk_test_your_key_here
DODO_WEBHOOK_SECRET=whsec_your_secret_here
DODO_PAYMENTS_RETURN_URL=http://localhost:3000/dashboard
DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_PAYMENTS_API_URL=https://api.dodopayments.com

# Required for Supabase admin operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Should already exist
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Pages Created

1. **Pricing Page**: `/pricing` - Displays subscription plans
2. **Dashboard Widget**: `components/SubscriptionWidget.tsx` - Shows usage stats

## API Routes Created

1. **POST /api/checkout** - Creates payment session
2. **POST /api/webhook/dodo-payments** - Handles Dodo webhooks
3. **GET /api/subscription** - Gets user's subscription info
4. **POST /api/usage** - Tracks feature usage
5. **GET /api/usage?feature=X** - Checks if user can use feature

## Quick Test Flow

1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/pricing`
3. Click "Get Started" on any plan
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. Get redirected to dashboard
7. Check subscription widget shows your plan
8. Test usage tracking in your features

## Need Help?

See full documentation: `docs/DODO_PAYMENTS_SETUP.md`
