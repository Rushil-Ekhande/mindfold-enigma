# Quick Guide: Apply Storage RLS Fix

## The Problem You're Seeing
```
Error [StorageApiError]: new row violates row-level security policy
```

This happens when therapists try to upload documents during re-verification.

## The Fix (3 Steps)

### Step 1: Apply the Migration
Go to your Supabase Dashboard → SQL Editor and run this migration:

**File**: `supabase/migrations/fix_storage_reverification.sql`

Or if you have Supabase CLI installed:
```bash
cd mindfold-enigma
supabase db push
```

### Step 2: Verify the Policies
In Supabase Dashboard → Storage → therapist-documents → Policies

You should see these policies:
- ✅ Therapists can upload to own folder
- ✅ Therapists can delete own documents
- ✅ Therapists can update own documents
- ✅ Users can view their own documents
- ✅ Admins can view all therapist documents
- ✅ Service role full access

### Step 3: Test the Flow
1. As admin, reject a therapist with reason "Test rejection"
2. Login as that therapist
3. Go to `/therapist/reverification`
4. Upload new documents
5. Should succeed without RLS errors ✅

## What Changed?
The migration adds storage policies that allow therapists to:
- Upload files to their own folder (`{user_id}/*`)
- Delete their old documents (needed when replacing files)
- Update their documents if needed

Previously, therapists could only upload to `temp/` folder during registration, but not to their own folder for re-verification.

## Rollback (if needed)
If something goes wrong, you can rollback by running:

```sql
-- Remove the new policies
DROP POLICY IF EXISTS "Therapists can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Therapists can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Therapists can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access" ON storage.objects;

-- Restore the old policy (from fix_therapist_registration.sql)
CREATE POLICY "Authenticated users can upload registration documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'therapist-documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'temp'
    );
```

## Need Help?
Check the full documentation in `STORAGE_RLS_FIX.md`
