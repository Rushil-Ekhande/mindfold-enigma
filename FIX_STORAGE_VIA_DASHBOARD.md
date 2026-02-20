# Fix Storage RLS via Supabase Dashboard (Alternative Method)

## Why This Method?
If you get the error `must be owner of relation objects` when running the SQL migration, use this method instead. The Supabase Dashboard UI has the necessary permissions.

---

## Step-by-Step Instructions

### Step 1: Open Storage Policies
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **Storage** in the left sidebar
4. Click on the **therapist-documents** bucket
5. Click the **Policies** tab

---

### Step 2: Delete Old Conflicting Policies (if they exist)
Look for and delete these policies if they exist:
- "Authenticated users can upload registration documents"
- "Therapists can upload their own documents" (old version)

Click the **...** menu → **Delete policy**

---

### Step 3: Create Upload Policy

Click **New Policy** → **For full customization**

**Policy Name**: `Therapists can upload to own folder`

**Allowed operation**: `INSERT`

**Target roles**: `authenticated`

**USING expression**: Leave empty (not needed for INSERT)

**WITH CHECK expression**:
```sql
(bucket_id = 'therapist-documents'::text) AND 
(
  ((storage.foldername(name))[1] = 'temp'::text) OR 
  ((auth.uid())::text = (storage.foldername(name))[1])
)
```

Click **Review** → **Save policy**

---

### Step 4: Create Delete Policy

Click **New Policy** → **For full customization**

**Policy Name**: `Therapists can delete own documents`

**Allowed operation**: `DELETE`

**Target roles**: `authenticated`

**USING expression**:
```sql
(bucket_id = 'therapist-documents'::text) AND 
((auth.uid())::text = (storage.foldername(name))[1])
```

**WITH CHECK expression**: Leave empty (not needed for DELETE)

Click **Review** → **Save policy**

---

### Step 5: Create Update Policy (Optional)

Click **New Policy** → **For full customization**

**Policy Name**: `Therapists can update own documents`

**Allowed operation**: `UPDATE`

**Target roles**: `authenticated`

**USING expression**:
```sql
(bucket_id = 'therapist-documents'::text) AND 
((auth.uid())::text = (storage.foldername(name))[1])
```

**WITH CHECK expression**:
```sql
(bucket_id = 'therapist-documents'::text) AND 
((auth.uid())::text = (storage.foldername(name))[1])
```

Click **Review** → **Save policy**

---

### Step 6: Verify Existing SELECT Policies

Make sure these policies exist (they should already be there):

**Policy**: `Users can view their own documents`
- Operation: SELECT
- Target: authenticated
- USING: `(bucket_id = 'therapist-documents'::text)`

**Policy**: `Admins can view all therapist documents`
- Operation: SELECT
- Target: authenticated
- USING: Should check if user is admin

If these don't exist, you may need to create them.

---

## Verify It Works

### Test 1: Check Policies
In the Policies tab, you should see:
- ✅ Therapists can upload to own folder (INSERT)
- ✅ Therapists can delete own documents (DELETE)
- ✅ Therapists can update own documents (UPDATE)
- ✅ Users can view their own documents (SELECT)
- ✅ Admins can view all therapist documents (SELECT)

### Test 2: Test Upload
1. As admin, reject a therapist
2. Login as that therapist
3. Go to `/therapist/reverification`
4. Upload new documents
5. Should succeed without RLS errors ✅

---

## Troubleshooting

### Still Getting RLS Errors?

**Check 1: Bucket Name**
- Verify the bucket is named exactly `therapist-documents` (with hyphen, not underscore)

**Check 2: Bucket Privacy**
- The bucket should be set to **Private** (not Public)

**Check 3: File Path**
- Files should be uploaded to `{user_id}/filename.ext`
- During registration, files go to `temp/filename.ext`

**Check 4: Authentication**
- Make sure the user is logged in (has valid JWT token)
- Check that `auth.uid()` returns the correct user ID

### View Current Policies via SQL

Run this in SQL Editor to see all current policies:
```sql
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;
```

---

## Alternative: Use Supabase CLI with Proper Auth

If you have Supabase CLI and want to use SQL:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push
```

This should have the proper permissions.

---

## Need More Help?

- Check the full documentation: `STORAGE_RLS_FIX.md`
- View the flow diagram: `REJECTION_FLOW_DIAGRAM.md`
- See testing guide: `TESTING_REJECTION_SYSTEM.md`

---

**Status**: Alternative method for users without SQL migration permissions
**Time**: ~10 minutes
**Difficulty**: Easy (just clicking through UI)
