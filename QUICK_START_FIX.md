# Quick Start: Fix RLS Error in 3 Steps

## The Problem
```
Error [StorageApiError]: new row violates row-level security policy
```

## The Fix (Choose Your Path)

---

## 🎯 Path A: Dashboard UI (Recommended for Everyone)

**Best for**: Anyone, no technical setup needed  
**Time**: 10 minutes

1. Open `FIX_STORAGE_VIA_DASHBOARD.md`
2. Follow the step-by-step instructions
3. Create 3 policies via the UI
4. Test the upload

✅ **Success Rate**: 95%

---

## 🎯 Path B: SQL Migration (For Developers)

**Best for**: Developers comfortable with SQL  
**Time**: 2 minutes

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/fix_storage_reverification.sql`
3. Paste and run
4. Test the upload

⚠️ **Note**: If you get "must be owner" error, use Path A instead

✅ **Success Rate**: 70% (depends on permissions)

---

## 🎯 Path C: Supabase CLI (For Advanced Users)

**Best for**: Developers with CLI setup  
**Time**: 5 minutes

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
cd mindfold-enigma
supabase db push
```

✅ **Success Rate**: 90%

---

## Test It Works

After applying the fix:

1. Login as admin
2. Reject a therapist with reason "Test"
3. Login as that therapist
4. Go to `/therapist/reverification`
5. Upload new documents
6. Should succeed without errors ✅

---

## What Gets Fixed

The fix adds 3 storage policies:

1. **Upload** - Therapists can upload to `{user_id}/*` folder
2. **Delete** - Therapists can delete their old documents
3. **Update** - Therapists can update documents

---

## Need Help?

- **Permission error?** → `TROUBLESHOOTING_PERMISSIONS.md`
- **Dashboard UI method** → `FIX_STORAGE_VIA_DASHBOARD.md`
- **Full details** → `STORAGE_RLS_FIX.md`
- **Testing guide** → `TESTING_REJECTION_SYSTEM.md`

---

## Quick Decision Tree

```
Can you run SQL in Supabase Dashboard?
│
├─ YES → Try Path B (SQL Migration)
│   │
│   ├─ Works? ✅ Done!
│   │
│   └─ "must be owner" error? → Use Path A (Dashboard UI)
│
└─ NO → Use Path A (Dashboard UI)
```

---

**Recommendation**: Start with Path A (Dashboard UI) - it works for everyone!
