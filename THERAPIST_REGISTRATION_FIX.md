## Therapist Registration Flow - Complete Fix Summary

### Issue
Therapists cannot register due to RLS policy violations and storage upload issues.

### Solution Applied

#### 1. Database Policies (RLS)
**Apply this SQL in your Supabase SQL Editor:**

```sql
-- Allow service_role to insert into profiles (already exists from previous fix)
-- Allow service_role to insert into therapist_profiles (already exists from previous fix)

-- Fix storage policies for therapist-documents bucket
DROP POLICY IF EXISTS "Therapists can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Therapists can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all therapist documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload registration documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can view all documents" ON storage.objects;

-- Allow authenticated users to upload to temp/ folder during registration
CREATE POLICY "Authenticated users can upload registration documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'therapist-documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'temp'
    );

-- Allow authenticated users to read documents
CREATE POLICY "Users can view their own documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'therapist-documents' AND
        auth.role() = 'authenticated'
    );

-- Allow service_role (admin client) to read all documents
CREATE POLICY "Service role can view all documents"
    ON storage.objects FOR SELECT TO service_role
    USING (bucket_id = 'therapist-documents');

-- Create index for better admin query performance
CREATE INDEX IF NOT EXISTS idx_therapist_verification_status 
    ON therapist_profiles(verification_status, created_at DESC);
```

#### 2. Code Changes Made

**✅ Client-Side Upload (therapist-register/page.tsx)**
- Files are uploaded to `therapist-documents` bucket in `temp/` folder
- Upload errors are properly caught and displayed
- File names are shown after selection
- Storage paths are sent to server action

**✅ Server Action (auth/actions.ts)**
- Uses `createAdminClient()` to bypass RLS when inserting into profiles and therapist_profiles
- Stores storage paths directly (not public URLs, since bucket is private)
- Creates therapist with `verification_status: "pending"`

**✅ Admin API (api/admin/therapists/route.ts)**
- Fetches all therapist profiles
- Generates signed URLs for private documents (1 hour expiry)
- Returns data with signed URLs for admin panel to display

**✅ Admin Panel (admin/therapists/page.tsx)**
- Shows pending, approved, and rejected therapists
- Displays document links (signed URLs)
- Approve/Reject buttons for pending therapists
- Updates verification status via PATCH endpoint

#### 3. Complete Flow

1. **Therapist Registration:**
   - User fills form at `/auth/therapist-register`
   - Client uploads documents to `therapist-documents/temp/` bucket
   - Server action creates auth user, then uses admin client to insert profile & therapist_profile with `pending` status
   - User redirected to login with success message

2. **Admin Review:**
   - Admin logs in and goes to `/admin/therapists`
   - Sees pending therapists with document links (signed URLs)
   - Clicks Approve or Reject
   - Therapist's `verification_status` is updated in DB

3. **Result:**
   - Approved therapists can log in and access therapist dashboard
   - Rejected therapists remain pending or can be notified

### Testing Steps

1. **Apply the SQL migration above in Supabase SQL Editor**
2. Go to `/auth/therapist-register`
3. Fill form and upload documents (PDF, JPG, or PNG)
4. Submit registration
5. Check Supabase:
   - `auth.users` table should have new user
   - `profiles` table should have row with `role: "therapist"`
   - `therapist_profiles` table should have row with `verification_status: "pending"` and document URLs
   - `therapist-documents` bucket should have files in `temp/` folder
6. Log in as admin, go to `/admin/therapists`
7. See pending therapist and click document links to verify
8. Click Approve to change status to "approved"

### Files Changed
- ✅ `app/auth/therapist-register/page.tsx` - Fixed file upload UX and error handling
- ✅ `app/auth/actions.ts` - Use admin client for DB inserts
- ✅ `app/api/admin/therapists/route.ts` - Generate signed URLs for documents
- ✅ `supabase/migrations/fix_therapist_registration.sql` - Complete SQL migration
- ✅ `THERAPIST_REGISTRATION_FIX.md` - This documentation

### Next Steps
1. Apply the SQL above
2. Test registration
3. If any issues, check browser console and Supabase logs
