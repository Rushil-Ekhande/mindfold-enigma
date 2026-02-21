# 🎯 Dodo Payments Implementation Checklist

Use this checklist to ensure everything is set up correctly.

## ✅ Pre-Setup

- [ ] Dodo Payments account created
- [ ] Supabase project accessible
- [ ] Node.js and npm installed
- [ ] Git repository initialized

---

## 📦 Installation

- [ ] Packages installed (`@dodopayments/nextjs`, `standardwebhooks`)
- [ ] No dependency errors
- [ ] `package.json` updated

---

## 🗄️ Database Setup

- [ ] Migration file created: `supabase/migrations/2026-02-21-dodo-payments-subscription-system.sql`
- [ ] Migration applied to Supabase
- [ ] Tables created:
  - [ ] `subscription_plans`
  - [ ] `user_subscriptions`
  - [ ] `usage_tracking`
  - [ ] `payment_history`
- [ ] Functions created:
  - [ ] `get_current_subscription()`
  - [ ] `get_or_create_usage_tracking()`
  - [ ] `can_use_feature()`
  - [ ] `increment_usage()`
- [ ] RLS policies enabled
- [ ] 3 subscription plans inserted (Basic, Intermediate, Advanced)

**Verify with:**
```sql
SELECT * FROM subscription_plans;
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
```

---

## 🔑 Dodo Payments Configuration

- [ ] Logged into Dodo Dashboard
- [ ] Created 3 products:
  - [ ] Basic ($9.99/month)
  - [ ] Intermediate ($19.99/month)
  - [ ] Advanced ($29.99/month)
- [ ] Copied product IDs
- [ ] Updated database with product IDs:
```sql
UPDATE subscription_plans SET dodo_product_id = 'pdt_xxx' WHERE plan_name = 'basic';
UPDATE subscription_plans SET dodo_product_id = 'pdt_xxx' WHERE plan_name = 'intermediate';
UPDATE subscription_plans SET dodo_product_id = 'pdt_xxx' WHERE plan_name = 'advanced';
```
- [ ] Generated API Key
- [ ] Generated Webhook Secret

---

## 🔐 Environment Variables

- [ ] `.env.local` file created
- [ ] Added Dodo credentials:
  - [ ] `DODO_PAYMENTS_API_KEY`
  - [ ] `DODO_WEBHOOK_SECRET`
  - [ ] `DODO_PAYMENTS_RETURN_URL`
  - [ ] `DODO_PAYMENTS_ENVIRONMENT` (test_mode)
  - [ ] `DODO_PAYMENTS_API_URL`
- [ ] Added Supabase credentials:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `.env.local` in `.gitignore`

---

## 🪝 Webhook Setup

- [ ] ngrok installed (for development)
- [ ] ngrok running: `ngrok http 3000`
- [ ] Webhook URL configured in Dodo Dashboard
- [ ] Webhook URL format: `https://xxx.ngrok.io/api/webhook/dodo-payments`
- [ ] Selected events:
  - [ ] subscription.active
  - [ ] subscription.renewed
  - [ ] subscription.cancelled
  - [ ] subscription.expired
  - [ ] subscription.on_hold
  - [ ] subscription.plan_changed
  - [ ] payment.succeeded
  - [ ] payment.failed
- [ ] Webhook secret matches `.env.local`

---

## 📄 Files Created

Frontend:
- [ ] `app/pricing/page.tsx` - Pricing page
- [ ] `components/SubscriptionWidget.tsx` - Dashboard widget

API Routes:
- [ ] `app/api/checkout/route.ts` - Checkout handler
- [ ] `app/api/webhook/dodo-payments/route.ts` - Webhook handler
- [ ] `app/api/subscription/route.ts` - Subscription info
- [ ] `app/api/usage/route.ts` - Usage tracking

Types:
- [ ] `lib/types.ts` - TypeScript definitions

Documentation:
- [ ] `docs/DODO_PAYMENTS_SETUP.md`
- [ ] `docs/QUICK_START.md`
- [ ] `docs/IMPLEMENTATION_SUMMARY.md`
- [ ] `docs/USAGE_TRACKING_EXAMPLES.tsx`

---

## 🧪 Testing

### Basic Flow Test
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to `/pricing`
- [ ] Page loads without errors
- [ ] All 3 plans visible
- [ ] Monthly/Yearly toggle works
- [ ] Click "Get Started" on Basic plan
- [ ] Redirected to Dodo checkout
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Redirected back to dashboard
- [ ] No console errors

### Database Verification
```sql
-- Check subscription created
SELECT * FROM user_subscriptions WHERE user_id = 'your-user-id';

-- Check usage tracking created
SELECT * FROM usage_tracking WHERE user_id = 'your-user-id';

-- Check payment recorded
SELECT * FROM payment_history WHERE user_id = 'your-user-id';
```

### Webhook Test
- [ ] Check Dodo Dashboard → Webhooks → Event Log
- [ ] `subscription.active` event received
- [ ] Webhook status: 200 OK
- [ ] No errors in logs

### Usage Tracking Test
```sql
-- Test can use feature
SELECT can_use_feature('your-user-id', 'quick_reflect');

-- Test increment usage
SELECT increment_usage('your-user-id', 'quick_reflect');

-- Verify usage incremented
SELECT * FROM usage_tracking WHERE user_id = 'your-user-id';
```

### Dashboard Widget Test
- [ ] Widget shows on dashboard
- [ ] Displays correct plan name
- [ ] Shows usage statistics
- [ ] Progress bars render correctly
- [ ] "Manage Subscription" link works

---

## 🔗 Integration

- [ ] Added `SubscriptionWidget` to dashboard
- [ ] Integrated usage tracking in Quick Reflect
- [ ] Integrated usage tracking in Deep Reflect
- [ ] Integrated usage tracking in Therapist Sessions
- [ ] Tested limit exceeded message
- [ ] Tested upgrade CTA

### Integration Pattern Checklist
For each feature (Quick Reflect, Deep Reflect, Therapist Sessions):
- [ ] Check usage before processing
- [ ] Show error if limit exceeded
- [ ] Process feature if allowed
- [ ] Increment usage after success
- [ ] Handle errors gracefully

---

## 🎨 UI Polish

- [ ] Pricing page matches brand colors
- [ ] Mobile responsive tested
- [ ] Loading states work
- [ ] Error messages clear
- [ ] Upgrade CTAs prominent
- [ ] FAQ section helpful

---

## 🔒 Security Review

- [ ] RLS policies enabled on all tables
- [ ] Webhook signature verification working
- [ ] Service role key not exposed to client
- [ ] API keys in environment variables
- [ ] User authentication required for all endpoints
- [ ] Input validation on all API routes

---

## 📊 Monitoring Setup

- [ ] Error logging configured
- [ ] Webhook delivery monitoring
- [ ] Payment failure alerts
- [ ] Usage limit warnings
- [ ] Subscription expiry notifications

---

## 🚀 Production Readiness

Before deploying to production:

- [ ] Change `DODO_PAYMENTS_ENVIRONMENT` to `live_mode`
- [ ] Use production API keys
- [ ] Update webhook URL to production domain
- [ ] Test with real card (small amount)
- [ ] Remove ngrok URL
- [ ] Update `DODO_PAYMENTS_RETURN_URL` to production
- [ ] Verify all environment variables in production
- [ ] Test production webhook endpoint
- [ ] Monitor first few transactions
- [ ] Set up customer support process
- [ ] Document cancellation process
- [ ] Plan for failed payment handling

---

## 📚 Documentation Review

- [ ] Read `DODO_PAYMENTS_SETUP.md`
- [ ] Read `QUICK_START.md`
- [ ] Read `IMPLEMENTATION_SUMMARY.md`
- [ ] Review `USAGE_TRACKING_EXAMPLES.tsx`
- [ ] Team members briefed on new features
- [ ] Customer-facing documentation updated

---

## ✅ Final Verification

- [ ] End-to-end subscription flow works
- [ ] All 3 plans can be purchased
- [ ] Webhooks received and processed
- [ ] Usage tracking functions correctly
- [ ] Limits enforced properly
- [ ] Upgrade flow works
- [ ] Cancellation works
- [ ] Dashboard shows correct info
- [ ] No console errors
- [ ] No database errors
- [ ] Performance acceptable
- [ ] Mobile experience good

---

## 🎉 Launch Ready

- [ ] All checkboxes above completed
- [ ] Team trained on new features
- [ ] Support documentation ready
- [ ] Monitoring in place
- [ ] Backup plan ready
- [ ] Rollback procedure documented

---

## 📝 Notes

Use this space for notes, issues encountered, or custom configurations:

```
[Your notes here]
```

---

**Once all items are checked, you're ready to launch the subscription system! 🚀**

Need help? See `docs/DODO_PAYMENTS_SETUP.md` for detailed guidance.
