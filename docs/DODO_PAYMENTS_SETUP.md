# Dodo Payments Subscription System - Setup Guide

This guide will help you set up the Dodo Payments subscription system for your MindFold application.

## 📋 Prerequisites

- Dodo Payments account ([sign up here](https://dodopayments.com))
- Supabase project with admin access
- Next.js application (already set up)

## 🗄️ Step 1: Database Setup

Run the migration file to create all necessary tables and functions:

```bash
# Apply the migration to your Supabase database
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/2026-02-21-dodo-payments-subscription-system.sql

# OR use Supabase CLI
supabase db push
```

This creates:
- `subscription_plans` - Available subscription tiers
- `user_subscriptions` - Active user subscriptions
- `usage_tracking` - Monthly usage tracking
- `payment_history` - Payment records
- PostgreSQL functions for usage management

## 🔑 Step 2: Dodo Payments Configuration

### 2.1 Create Products in Dodo Dashboard

1. Log in to [Dodo Payments Dashboard](https://dashboard.dodopayments.com)
2. Navigate to Products → Create Product
3. Create 3 subscription products:

**Basic Plan:**
- Name: "MindFold Basic"
- Type: Subscription
- Monthly Price: $9.99
- Yearly Price: $99.99 (optional)
- Copy the Product ID

**Intermediate Plan:**
- Name: "MindFold Intermediate"
- Type: Subscription
- Monthly Price: $19.99
- Yearly Price: $199.99 (optional)
- Copy the Product ID

**Advanced Plan:**
- Name: "MindFold Advanced"
- Type: Subscription
- Monthly Price: $29.99
- Yearly Price: $299.99 (optional)
- Copy the Product ID

### 2.2 Update Database with Product IDs

```sql
-- Update subscription plans with Dodo product IDs
UPDATE subscription_plans SET dodo_product_id = 'pdt_your_basic_id' WHERE plan_name = 'basic';
UPDATE subscription_plans SET dodo_product_id = 'pdt_your_intermediate_id' WHERE plan_name = 'intermediate';
UPDATE subscription_plans SET dodo_product_id = 'pdt_your_advanced_id' WHERE plan_name = 'advanced';
```

### 2.3 Get API Keys

1. In Dodo Dashboard, go to Settings → API Keys
2. Copy your:
   - **API Key** (starts with `sk_`)
   - **Webhook Secret** (for signature verification)

## 🔐 Step 3: Environment Variables

Create or update your `.env.local` file:

```bash
# Dodo Payments Configuration
DODO_PAYMENTS_API_KEY=sk_your_api_key_here
DODO_WEBHOOK_SECRET=whsec_your_webhook_secret_here
DODO_PAYMENTS_RETURN_URL=http://localhost:3000/dashboard
DODO_PAYMENTS_ENVIRONMENT=test_mode  # Use 'live_mode' for production
DODO_PAYMENTS_API_URL=https://api.dodopayments.com

# Dodo Product IDs
DODO_PRODUCT_ID_BASIC=pdt_basic_id
DODO_PRODUCT_ID_INTERMEDIATE=pdt_intermediate_id
DODO_PRODUCT_ID_ADVANCED=pdt_advanced_id

# Supabase (if not already present)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important:** Never commit `.env.local` to version control!

## 🪝 Step 4: Configure Webhooks

### 4.1 Set Up Webhook Endpoint

For development, use ngrok or similar:

```bash
# Install ngrok if you haven't
brew install ngrok  # macOS
# or download from https://ngrok.com

# Start ngrok tunnel
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 4.2 Add Webhook in Dodo Dashboard

1. Go to Dodo Dashboard → Settings → Webhooks
2. Click "Add Endpoint"
3. Enter webhook URL: `https://your-domain.com/api/webhook/dodo-payments`
   - For development: `https://abc123.ngrok.io/api/webhook/dodo-payments`
4. Select events to listen for:
   - ✅ subscription.active
   - ✅ subscription.renewed
   - ✅ subscription.cancelled
   - ✅ subscription.expired
   - ✅ subscription.on_hold
   - ✅ subscription.plan_changed
   - ✅ payment.succeeded
   - ✅ payment.failed
5. Save and copy the **Webhook Secret** to your `.env.local`

## 🚀 Step 5: Test the Integration

### 5.1 Start Development Server

```bash
npm run dev
```

### 5.2 Test Subscription Flow

1. Navigate to `http://localhost:3000/pricing`
2. Select a plan (use test mode)
3. Complete checkout with test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
4. After payment, you should be redirected to dashboard
5. Check webhook logs in Dodo Dashboard
6. Verify subscription in database:

```sql
SELECT * FROM user_subscriptions;
SELECT * FROM usage_tracking;
SELECT * FROM payment_history;
```

### 5.3 Test Usage Tracking

Try using features that consume usage:
- Quick Reflect: Should decrement `quick_reflect_used`
- Deep Reflect: Should decrement `deep_reflect_used`
- Therapist Sessions: Should decrement `therapist_sessions_used`

Check usage in dashboard or query:

```sql
SELECT 
    ut.*,
    sp.quick_reflect_limit,
    sp.deep_reflect_limit,
    sp.therapist_sessions_per_week
FROM usage_tracking ut
JOIN user_subscriptions us ON ut.subscription_id = us.id
JOIN subscription_plans sp ON us.plan_name = sp.plan_name
WHERE ut.user_id = 'your-user-id';
```

## 📊 Step 6: Add Subscription Widget to Dashboard

Update your dashboard page to include the subscription widget:

```tsx
import SubscriptionWidget from "@/components/SubscriptionWidget";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Your existing dashboard content */}
      <div className="lg:col-span-2">
        {/* Main content */}
      </div>
      
      {/* Subscription widget in sidebar */}
      <div className="lg:col-span-1">
        <SubscriptionWidget />
      </div>
    </div>
  );
}
```

## 🔄 Step 7: Integrate Usage Tracking in Features

Update your AI reflection and therapist session features to check and track usage:

### Example: Quick Reflect

```typescript
// Before processing quick reflect request
const checkResponse = await fetch('/api/usage?feature=quick_reflect');
const { canUse } = await checkResponse.json();

if (!canUse) {
  alert('You have reached your monthly limit for Quick Reflect. Please upgrade your plan.');
  return;
}

// Process the reflection...

// After successful reflection, increment usage
await fetch('/api/usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ feature: 'quick_reflect' }),
});
```

### Example: Deep Reflect

```typescript
// Before processing deep reflect request
const checkResponse = await fetch('/api/usage?feature=deep_reflect');
const { canUse } = await checkResponse.json();

if (!canUse) {
  alert('You have reached your monthly limit for Deep Reflect. Please upgrade your plan.');
  return;
}

// Process the reflection...

// After successful reflection, increment usage
await fetch('/api/usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ feature: 'deep_reflect' }),
});
```

### Example: Therapist Session

```typescript
// Before booking therapist session
const checkResponse = await fetch('/api/usage?feature=therapist_session');
const { canUse } = await checkResponse.json();

if (!canUse) {
  alert('You have reached your weekly limit for therapist sessions. Please upgrade your plan.');
  return;
}

// Book the session...

// After successful booking, increment usage
await fetch('/api/usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ feature: 'therapist_session' }),
});
```

## 🎨 Step 8: Customize UI (Optional)

### Update Colors and Branding

Edit `app/pricing/page.tsx` to match your brand:

```tsx
// Change plan highlights
const plans = [
  {
    // ... other properties
    highlighted: true, // Set to true for featured plan
  }
];
```

### Add Custom Features

You can add more features to plans by updating the database:

```sql
UPDATE subscription_plans 
SET features = ARRAY[
  'Your custom feature 1',
  'Your custom feature 2',
  -- ... add more features
] 
WHERE plan_name = 'basic';
```

## 🚨 Common Issues & Troubleshooting

### Issue: Webhook not receiving events

**Solution:**
1. Check webhook URL is correct in Dodo Dashboard
2. Verify ngrok is running (for development)
3. Check webhook secret in `.env.local` matches Dodo Dashboard
4. Check webhook logs in Dodo Dashboard for errors

### Issue: Subscription not created after payment

**Solution:**
1. Check webhook is configured and receiving `subscription.active` event
2. Verify database permissions (RLS policies)
3. Check API logs for errors
4. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

### Issue: Usage tracking not working

**Solution:**
1. Verify subscription is active: `SELECT * FROM user_subscriptions WHERE user_id = 'your-id';`
2. Check if usage_tracking record exists
3. Run: `SELECT can_use_feature('your-user-id', 'quick_reflect');`
4. Check PostgreSQL function logs

### Issue: Checkout fails to create

**Solution:**
1. Verify `DODO_PAYMENTS_API_KEY` is correct
2. Check product IDs are set in database
3. Ensure return URL is correct
4. Check API response for detailed error

## 📝 Production Checklist

Before going live:

- [ ] Change `DODO_PAYMENTS_ENVIRONMENT` to `live_mode`
- [ ] Use production API keys from Dodo Dashboard
- [ ] Update webhook URL to production domain
- [ ] Test full payment flow with real card (small amount)
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Review RLS policies for security
- [ ] Test subscription cancellation flow
- [ ] Test plan upgrade/downgrade flow
- [ ] Monitor webhook delivery success rate
- [ ] Set up alerts for failed payments

## 📚 Additional Resources

- [Dodo Payments Documentation](https://docs.dodopayments.com)
- [Dodo Payments Next.js Adapter](https://docs.dodopayments.com/developer-resources/nextjs-adaptor)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Support

If you encounter any issues:
1. Check logs in Dodo Dashboard → Webhooks → Event Log
2. Check Supabase logs: Dashboard → Logs
3. Check browser console for client-side errors
4. Contact Dodo Payments support: support@dodopayments.com

---

**Congratulations!** 🎉 You've successfully integrated Dodo Payments subscription system into your MindFold application!
