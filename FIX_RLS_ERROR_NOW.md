# 🔧 FIX: Storage RLS Error - Action Required

## ⚠️ Current Issue
```
Error [StorageApiError]: new row violates row-level security policy
```

Therapists cannot upload documents during re-verification.

---

## ✅ Solution - Choose One Method

### Method 1: SQL Migration (Recommended)

**Step 1**: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

**Step 2**: Copy & Run This SQL
Open the file: `supabase/migrations/fix_storage_reverification.sql`

Copy the entire contents and paste into the SQL Editor, then click "Run".

**Step 3**: Verify
After running, you should see:
```
Success. No rows returned
```

---

### Method 2: Dashboard UI (If SQL Fails)

If you get error `must be owner of relation objects`, use the Dashboard UI instead.

**Full instructions**: See `FIX_STORAGE_VIA_DASHBOARD.md`

**Quick steps**:
1. Go to Storage → therapist-documents → Policies
2. Create 3 new policies (Upload, Delete, Update)
3. Copy the expressions from the guide
4. Save and test

---

## 🧪 Test It Works

1. As admin, reject a therapist (any reason)
2. Login as that therapist
3. Go to `/therapist/reverification`
4. Upload new documents
5. Should succeed ✅ (no more RLS errors)

---

## 📋 What This Does

The fix adds storage policies that allow:

1. **Upload Policy** - Therapists can upload to their own folder (`{user_id}/*`)
2. **Delete Policy** - Therapists can delete old documents
3. **Update Policy** - Therapists can update documents

---

## 📚 More Info

- **SQL method fails?**: `FIX_STORAGE_VIA_DASHBOARD.md`
- **Full details**: `STORAGE_RLS_FIX.md`
- **Testing guide**: `TESTING_REJECTION_SYSTEM.md`
- **Complete system**: `REJECTION_SYSTEM_COMPLETE.md`

---

## 🆘 If It Doesn't Work

1. Check the bucket name is `therapist-documents`
2. Verify the bucket exists in Supabase Storage
3. Check the migration ran without errors
4. Try the Dashboard UI method instead
5. Try refreshing the page and uploading again

---

**Status**: Ready to apply ✅
**Time to fix**: ~2-10 minutes (depending on method)
**Risk**: Low (only adds policies, doesn't modify data)
