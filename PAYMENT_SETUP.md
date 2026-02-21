# 🚀 QUICK SETUP GUIDE - DODO PAYMENTS

## ✅ All Packages Already Installed
```json
"@dodopayments/nextjs": "^0.3.4",
"standardwebhooks": "^1.0.0"
```

## 📝 STEP 1: Add Environment Variables

Create `.env.local` file in your project root:

```bash
# Supabase (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Dodo Payments (get from dashboard.dodopayments.com)
DODO_PAYMENTS_API_KEY=sk_test_your_key
DODO_WEBHOOK_SECRET=whsec_your_secret
DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_PAYMENTS_API_URL=https://api.dodopayments.com
DODO_PAYMENTS_RETURN_URL=http://localhost:3000/dashboard
```

## 🗄️ STEP 2: Run Database Migration

### Option A: Using Supabase CLI (Recommended)
```bash
supabase db push
```

### Option B: Manually in Supabase Dashboard
1. Go to: https://app.supabase.com/project/YOUR_PROJECT/sql/new
2. Copy entire content from: `supabase/migrations/2026-02-21-dodo-payments-subscription-system.sql`
3. Paste and click "Run"

### Verify Installation
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscription_plans', 'user_subscriptions', 'usage_tracking', 'payment_history');

-- Check functions created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_current_subscription', 'can_use_feature', 'increment_usage');

-- View subscription plans
SELECT * FROM subscription_plans;
```

## 🎯 STEP 3: Create Products in Dodo Dashboard

1. Go to: https://dashboard.dodopayments.com
2. Navigate to: Products → Create Product
3. Create 3 subscription products:

### Product 1: Basic Plan
- Name: `MindFold Basic`
- Type: `Subscription`
- Billing: `Monthly`
- Price: `$9.99`
- Copy the **Product ID** (starts with `pdt_`)

### Product 2: Intermediate Plan
- Name: `MindFold Intermediate`
- Type: `Subscription`
- Billing: `Monthly`
- Price: `$19.99`
- Copy the **Product ID**

### Product 3: Advanced Plan
- Name: `MindFold Advanced`
- Type: `Subscription`
- Billing: `Monthly`
- Price: `$29.99`
- Copy the **Product ID**

## 🔄 STEP 4: Update Database with Product IDs

Run in Supabase SQL Editor:

```sql
-- Replace pdt_xxx with your actual product IDs from Dodo Dashboard
UPDATE subscription_plans 
SET dodo_product_id = 'pdt_your_basic_id_here' 
WHERE plan_name = 'basic';

UPDATE subscription_plans 
SET dodo_product_id = 'pdt_your_intermediate_id_here' 
WHERE plan_name = 'intermediate';

UPDATE subscription_plans 
SET dodo_product_id = 'pdt_your_advanced_id_here' 
WHERE plan_name = 'advanced';

-- Verify update
SELECT plan_name, dodo_product_id FROM subscription_plans;
```

## 🪝 STEP 5: Configure Webhook

### For Development (using ngrok):
```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com

# Start ngrok
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### In Dodo Dashboard:
1. Go to: Settings → Webhooks → Add Endpoint
2. URL: `https://your-ngrok-url.ngrok-free.app/api/webhook/dodo-payments`
3. Select these events:
   - ✅ subscription.active
   - ✅ subscription.renewed
   - ✅ subscription.cancelled
   - ✅ subscription.expired
   - ✅ subscription.on_hold
   - ✅ subscription.plan_changed
   - ✅ payment.succeeded
   - ✅ payment.failed
4. Save and copy the **Webhook Secret**
5. Add to `.env.local`: `DODO_WEBHOOK_SECRET=whsec_your_secret`

## 🧪 STEP 6: Test Everything

### Start your dev server:
```bash
npm run dev
```

### Test the flow:
1. Open: http://localhost:3000/pricing
2. Click "Get Started" on any plan
3. Use test card: `4242 4242 4242 4242`
4. Expiry: Any future date (e.g., 12/25)
5. CVC: Any 3 digits (e.g., 123)
6. Complete payment
7. You should be redirected to dashboard

### Verify in Database:
```sql
-- Check subscription created
SELECT * FROM user_subscriptions 
ORDER BY created_at DESC LIMIT 1;

-- Check usage tracking created
SELECT * FROM usage_tracking 
ORDER BY created_at DESC LIMIT 1;

-- Check payment recorded
SELECT * FROM payment_history 
ORDER BY created_at DESC LIMIT 1;
```

### Check Webhook:
- Go to: Dodo Dashboard → Webhooks → Event Log
- You should see `subscription.active` event with 200 status

## 📱 STEP 7: View in Dashboard

Navigate to: http://localhost:3000/dashboard/overview

You should see:
- Subscription widget on the right sidebar
- Current plan displayed
- Usage stats (0/15 Quick Reflect, etc.)

## ✨ All Routes Available

### Frontend:
- `/pricing` - Subscription plans page
- `/dashboard/overview` - Dashboard with subscription widget

### API:
- `POST /api/checkout` - Create payment session
- `POST /api/webhook/dodo-payments` - Webhook handler
- `GET /api/subscription` - Get user subscription
- `GET /api/usage?feature=quick_reflect` - Check usage
- `POST /api/usage` - Increment usage

## 🔧 Integration Example

To add usage tracking to your AI features:

```typescript
// Before using a feature
const response = await fetch('/api/usage?feature=quick_reflect');
const { canUse } = await response.json();

if (!canUse) {
  alert('Monthly limit reached! Upgrade your plan.');
  return;
}

// Process your feature...

// After success, increment usage
await fetch('/api/usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ feature: 'quick_reflect' })
});
```

See full examples in: `docs/USAGE_TRACKING_EXAMPLES.tsx`

## ✅ Checklist

- [ ] Environment variables added to `.env.local`
- [ ] Database migration run successfully
- [ ] 3 products created in Dodo Dashboard
- [ ] Product IDs updated in database
- [ ] Webhook configured and tested
- [ ] Test payment completed
- [ ] Subscription visible in dashboard
- [ ] Webhook event received (200 status)

## 🎉 You're Done!

Everything is now working! Test by:
1. Going to `/pricing`
2. Selecting a plan
3. Completing payment
4. Viewing usage in dashboard

## 🆘 Need Help?

See detailed documentation:
- `docs/DODO_PAYMENTS_SETUP.md` - Complete guide
- `docs/USAGE_TRACKING_EXAMPLES.tsx` - Code examples
- `docs/SETUP_CHECKLIST.md` - Full verification checklist

Or check Dodo's docs: https://docs.dodopayments.com
