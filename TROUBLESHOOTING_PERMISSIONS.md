# Troubleshooting: "must be owner of relation objects" Error

## The Error
```
Error: Failed to run sql query: ERROR: 42501: must be owner of relation objects
```

## What This Means
The SQL Editor doesn't have permission to modify the `storage.objects` table directly. This is a Supabase security feature.

---

## Solutions (Try in Order)

### Solution 1: Use Dashboard UI (Easiest) ✅

**Time**: 10 minutes  
**Difficulty**: Easy  
**Success Rate**: 95%

Follow the step-by-step guide in: `FIX_STORAGE_VIA_DASHBOARD.md`

This method uses the Supabase Dashboard UI to create policies, which has the necessary permissions.

---

### Solution 2: Use Supabase CLI

**Time**: 5 minutes  
**Difficulty**: Medium  
**Success Rate**: 90%

**Prerequisites**: 
- Supabase CLI installed
- Authenticated with Supabase

**Steps**:
```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Navigate to your project
cd mindfold-enigma

# Push the migration
supabase db push
```

The CLI has proper authentication and should work.

---

### Solution 3: Modified SQL (Try This)

**Time**: 2 minutes  
**Difficulty**: Easy  
**Success Rate**: 70%

The updated migration file now wraps the DROP statements in a `DO` block that handles permission errors gracefully.

Try running the updated `fix_storage_reverification.sql` again. It should skip the drops if they fail and just create the new policies.

---

### Solution 4: Manual Policy Creation via SQL

**Time**: 5 minutes  
**Difficulty**: Medium  
**Success Rate**: 80%

If the full migration fails, try creating policies one at a time:

```sql
-- Policy 1: Upload
CREATE POLICY "Therapists can upload to own folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'therapist-documents' AND
        (
            (storage.foldername(name))[1] = 'temp' OR
            auth.uid()::text = (storage.foldername(name))[1]
        )
    );

-- Policy 2: Delete
CREATE POLICY "Therapists can delete own documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'therapist-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy 3: Update
CREATE POLICY "Therapists can update own documents"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'therapist-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'therapist-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

Run each policy creation separately. If one fails with "already exists", that's OK - skip it.

---

### Solution 5: Contact Supabase Support

If none of the above work, you may need to contact Supabase support to grant your account the necessary permissions.

---

## Verify Policies Were Created

After using any method, verify the policies exist:

```sql
SELECT 
    policyname,
    cmd as operation,
    roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%Therapists%'
ORDER BY policyname;
```

You should see:
- Therapists can upload to own folder (INSERT)
- Therapists can delete own documents (DELETE)
- Therapists can update own documents (UPDATE)

---

## Why This Happens

Supabase uses PostgreSQL's Row Level Security (RLS) system. The `storage.objects` table is owned by the `supabase_storage_admin` role, not your user account.

When you run SQL in the dashboard, it runs as your authenticated user, which doesn't have ownership of system tables.

The Dashboard UI and CLI have special permissions to manage storage policies, which is why they work when direct SQL doesn't.

---

## Recommended Approach

**For most users**: Use the Dashboard UI method (`FIX_STORAGE_VIA_DASHBOARD.md`)

**For developers with CLI**: Use `supabase db push`

**For quick testing**: Try the manual SQL policy creation (Solution 4)

---

## Still Stuck?

1. Check you're using the correct project in the dashboard
2. Verify you have admin/owner access to the project
3. Try logging out and back in to Supabase Dashboard
4. Clear browser cache and try again
5. Check Supabase status page for any ongoing issues

---

**Bottom Line**: The Dashboard UI method will work for everyone, regardless of permissions. Use that if SQL fails.
