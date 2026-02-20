# Storage RLS Policy Fix for Therapist Re-verification

## Problem
Therapists were unable to upload documents during re-verification due to RLS (Row Level Security) policy blocking uploads to their own folder.

**Error**: `new row violates row-level security policy`

## Root Cause
The existing storage policies only allowed uploads to the `temp/` folder (used during initial registration), but not to the therapist's own folder (`{user_id}/*`) which is needed for re-verification.

## Solution
Created new storage policies that allow therapists to:
1. Upload documents to their own folder (`{user_id}/*`)
2. Delete their own old documents (needed when replacing files)
3. Update their own documents (for future flexibility)

## Migration Applied
File: `supabase/migrations/fix_storage_reverification.sql`

### Key Policies Added:
1. **Therapists can upload to own folder** - Allows uploads to both `temp/` (registration) and `{user_id}/*` (re-verification)
2. **Therapists can delete own documents** - Allows deletion of old documents before uploading new ones
3. **Therapists can update own documents** - Allows updates if needed in the future
4. **Service role full access** - Ensures admin operations work without restrictions

## How to Apply
Run the migration in your Supabase dashboard:

### Method 1: SQL Editor (Recommended)
```bash
# Copy the contents of supabase/migrations/fix_storage_reverification.sql
# Paste into Supabase Dashboard → SQL Editor → Run
```

**Note**: If you get error `must be owner of relation objects`, use Method 2 instead.

### Method 2: Dashboard UI (Always Works)
See detailed instructions in: `FIX_STORAGE_VIA_DASHBOARD.md`

This method uses the Supabase Dashboard UI to create policies, which has the necessary permissions.

### Method 3: Supabase CLI
```bash
supabase db push
```

## Testing the Fix
1. As admin, reject a therapist application with a reason
2. Login as that therapist
3. Navigate to `/therapist/reverification`
4. Upload new Government ID and Degree Certificate
5. Verify the upload succeeds without RLS errors
6. Check that old documents are deleted from storage
7. Verify the therapist profile is updated to "pending" status

## Files Modified
- `supabase/migrations/fix_storage_reverification.sql` (NEW)

## Related Files
- `app/api/therapists/reverification/route.ts` - Handles document upload
- `app/therapist/reverification/page.tsx` - Frontend for re-verification
- `supabase/migrations/therapist_rejection_system.sql` - Rejection system schema
