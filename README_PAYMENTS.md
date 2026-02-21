# ✅ PAYMENT SYSTEM - READY TO USE

## 🎉 Everything is Installed & Integrated!

All Dodo Payments functionality has been implemented in your app. Follow the steps below to activate it.

---

## 📦 Packages Already Installed ✅

```json
{
  "@dodopayments/nextjs": "^0.3.4",
  "standardwebhooks": "^1.0.0",
  "@supabase/supabase-js": "^2.97.0"
}
```

---

## 🗄️ DATABASE SETUP

### Run this SQL migration:

**File Location**: `supabase/migrations/2026-02-21-dodo-payments-subscription-system.sql`

**How to run**:
```bash
# Option 1: Supabase CLI
supabase db push

# Option 2: Supabase Dashboard
# Go to SQL Editor and paste the entire migration file
```

**What it creates**:
- ✅ `subscription_plans` table (3 plans: Basic, Intermediate, Advanced)
- ✅ `user_subscriptions` table (tracks active subscriptions)
- ✅ `usage_tracking` table (monthly usage limits)
- ✅ `payment_history` table (payment records)
- ✅ 4 PostgreSQL functions for usage management
- ✅ Row Level Security policies

---

## 🔑 ENVIRONMENT VARIABLES TO ADD

Create `.env.local` file with:

```bash
# ============================================================================
# SUPABASE (you should already have these)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================================================
# DODO PAYMENTS (get from dashboard.dodopayments.com)
# ============================================================================
DODO_PAYMENTS_API_KEY=sk_test_your_api_key_here
DODO_WEBHOOK_SECRET=whsec_your_webhook_secret_here
DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_PAYMENTS_API_URL=https://api.dodopayments.com
DODO_PAYMENTS_RETURN_URL=http://localhost:3000/dashboard
```

**Get Dodo keys from**: https://dashboard.dodopayments.com/settings/api-keys

---

## 🎯 DODO DASHBOARD SETUP

### 1. Create 3 Subscription Products

Go to: https://dashboard.dodopayments.com/products

**Product 1 - Basic**:
- Name: MindFold Basic
- Type: Subscription
- Price: $9.99/month
- Copy Product ID (starts with `pdt_`)

**Product 2 - Intermediate**:
- Name: MindFold Intermediate
- Type: Subscription
- Price: $19.99/month
- Copy Product ID

**Product 3 - Advanced**:
- Name: MindFold Advanced
- Type: Subscription
- Price: $29.99/month
- Copy Product ID

### 2. Update Database with Product IDs

Run in Supabase SQL Editor:

```sql
UPDATE subscription_plans SET dodo_product_id = 'pdt_your_basic_id' WHERE plan_name = 'basic';
UPDATE subscription_plans SET dodo_product_id = 'pdt_your_intermediate_id' WHERE plan_name = 'intermediate';
UPDATE subscription_plans SET dodo_product_id = 'pdt_your_advanced_id' WHERE plan_name = 'advanced';
```

### 3. Configure Webhook

**For Development**:
```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

**In Dodo Dashboard**:
- Go to: Settings → Webhooks → Add Endpoint
- URL: `https://your-ngrok-url.ngrok-free.app/api/webhook/dodo-payments`
- Events: Select all subscription and payment events
- Save and copy Webhook Secret
- Add to `.env.local`: `DODO_WEBHOOK_SECRET=whsec_...`

---

## 🧪 TEST THE INTEGRATION

```bash
# Start dev server
npm run dev

# Start ngrok (in another terminal)
ngrok http 3000
```

### Test Flow:
1. ✅ Go to: http://localhost:3000/pricing
2. ✅ Click "Get Started" on any plan
3. ✅ Use test card: `4242 4242 4242 4242`
4. ✅ Complete payment
5. ✅ Redirected to dashboard
6. ✅ See subscription widget on right sidebar

### Verify in Database:
```sql
SELECT * FROM user_subscriptions ORDER BY created_at DESC LIMIT 1;
SELECT * FROM usage_tracking ORDER BY created_at DESC LIMIT 1;
SELECT * FROM payment_history ORDER BY created_at DESC LIMIT 1;
```

---

## 🎨 WHAT'S BEEN INTEGRATED

### Frontend Pages:
- ✅ `/pricing` - Beautiful pricing page with 3 plans
- ✅ `/dashboard/overview` - Dashboard with subscription widget in sidebar

### API Routes:
- ✅ `POST /api/checkout` - Creates Dodo payment session
- ✅ `POST /api/webhook/dodo-payments` - Handles all webhook events
- ✅ `GET /api/subscription` - Returns user's subscription & usage
- ✅ `GET /api/usage?feature=X` - Checks if user can use feature
- ✅ `POST /api/usage` - Increments usage counter

### Components:
- ✅ `components/SubscriptionWidget.tsx` - Shows plan, usage, limits
- ✅ Integrated into dashboard overview page

### Database Functions:
- ✅ `can_use_feature(user_id, feature)` - Check usage limit
- ✅ `increment_usage(user_id, feature)` - Track usage
- ✅ `get_current_subscription(user_id)` - Get active subscription
- ✅ `get_or_create_usage_tracking()` - Manage usage records

---

## 📊 SUBSCRIPTION PLANS

| Plan | Price | Quick Reflect | Deep Reflect | Therapist Sessions |
|------|-------|--------------|--------------|-------------------|
| Basic | $9.99/mo | 15/month | 5/month | 2/week |
| Intermediate | $19.99/mo | 25/month | 10/month | 3/week |
| Advanced | $29.99/mo | 30/month | 15/month | 4/week |

All plans include:
- ✅ Unlimited journal entries
- ✅ Monthly wrap reports
- ✅ AI-powered reflections (within limits)

---

## 🔧 HOW TO INTEGRATE USAGE TRACKING

Add to your AI features (Quick Reflect, Deep Reflect, Therapist Sessions):

```typescript
// BEFORE using the feature
const checkResponse = await fetch('/api/usage?feature=quick_reflect');
const { canUse } = await checkResponse.json();

if (!canUse) {
  alert('Monthly limit reached! Upgrade your plan.');
  return;
}

// YOUR FEATURE LOGIC HERE...

// AFTER successful operation
await fetch('/api/usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ feature: 'quick_reflect' })
});
```

**Feature names**:
- `'quick_reflect'` - Quick AI reflection
- `'deep_reflect'` - Deep AI analysis
- `'therapist_session'` - Therapist session booking

**See full examples**: `docs/USAGE_TRACKING_EXAMPLES.tsx`

---

## ✅ FINAL CHECKLIST

- [ ] `.env.local` file created with all variables
- [ ] Database migration run successfully
- [ ] 3 products created in Dodo Dashboard
- [ ] Product IDs updated in database
- [ ] Webhook configured with ngrok URL
- [ ] Test payment completed successfully
- [ ] Subscription visible in dashboard widget
- [ ] Webhook events received (check Dodo Dashboard)

---

## 🚀 YOU'RE READY!

Everything is now installed and integrated. Just need to:
1. Add environment variables
2. Run database migration
3. Create Dodo products
4. Test with test card

**Need help?** See: `PAYMENT_SETUP.md` for detailed guide

---

## 📚 Documentation

- **Quick Setup**: `PAYMENT_SETUP.md`
- **Full Guide**: `docs/DODO_PAYMENTS_SETUP.md`
- **Code Examples**: `docs/USAGE_TRACKING_EXAMPLES.tsx`
- **Verification**: `docs/SETUP_CHECKLIST.md`
- **Summary**: `docs/IMPLEMENTATION_SUMMARY.md`

---

## 🎉 Summary

**Installed**: ✅ All packages  
**Created**: ✅ All files and routes  
**Integrated**: ✅ Dashboard widget  
**Ready**: ✅ Just need config!

**Next Step**: Add environment variables and run migration! 🚀
