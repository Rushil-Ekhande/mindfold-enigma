# Deployment Checklist - Therapist Rejection System

## Pre-Deployment Checks

### 1. Environment Variables ✅
- [ ] `SUPABASE_URL` is set
- [ ] `SUPABASE_ANON_KEY` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (CRITICAL for admin operations)

### 2. Database Migrations ✅
Run these migrations IN ORDER:

- [ ] `therapist_rejection_system.sql` - Adds rejection columns and history table
- [ ] `fix_storage_reverification.sql` - Fixes storage RLS policies

**How to apply**:
```bash
# Option 1: Supabase Dashboard
Go to SQL Editor → Paste migration → Run

# Option 2: Supabase CLI
cd mindfold-enigma
supabase db push
```

### 3. Storage Bucket ✅
- [ ] Bucket `therapist-documents` exists
- [ ] Bucket is set to PRIVATE (not public)
- [ ] Policies are applied (check after running migration)

**Verify policies exist**:
- Therapists can upload to own folder
- Therapists can delete own documents
- Therapists can update own documents
- Users can view their own documents
- Admins can view all therapist documents
- Service role full access

### 4. Code Deployment ✅
All files are already in place:

**Backend**:
- [ ] `app/api/admin/stats/route.ts` (rejection logic)
- [ ] `app/api/therapists/reverification/route.ts` (resubmission)

**Frontend**:
- [ ] `app/admin/therapists/page.tsx` (rejection dialog)
- [ ] `app/therapist/overview/page.tsx` (rejection alerts)
- [ ] `app/therapist/reverification/page.tsx` (resubmission page)

## Post-Deployment Testing

### Test 1: Admin Rejection ✅
- [ ] Login as admin
- [ ] Go to `/admin/therapists`
- [ ] Find a pending therapist
- [ ] Click "Reject"
- [ ] Enter reason: "Test rejection"
- [ ] Confirm rejection
- [ ] Verify therapist moves to "rejected" tab
- [ ] Verify rejection_count = 1

### Test 2: Therapist Re-verification ✅
- [ ] Login as rejected therapist
- [ ] Go to `/therapist/overview`
- [ ] See red rejection alert with reason
- [ ] See rejection count (1/3)
- [ ] Click "Re-submit Documents"
- [ ] Go to `/therapist/reverification`
- [ ] Upload new Government ID (PDF/JPG/PNG, < 5MB)
- [ ] Upload new Degree Certificate (PDF/JPG/PNG, < 5MB)
- [ ] Click "Submit for Re-verification"
- [ ] Verify success message appears
- [ ] Verify redirect to overview
- [ ] Verify status changed to "pending"

### Test 3: Storage RLS (CRITICAL) ✅
- [ ] During re-verification upload, NO RLS errors
- [ ] Old documents deleted from storage
- [ ] New documents uploaded successfully
- [ ] New document URLs in database

### Test 4: Maximum Rejections ✅
- [ ] Reject same therapist 3 times
- [ ] After 3rd rejection, verify:
  - [ ] rejection_count = 3
  - [ ] can_resubmit = false
  - [ ] "Re-submit Documents" button hidden
  - [ ] Access to `/therapist/reverification` blocked
  - [ ] Shows "Maximum rejection limit reached"

### Test 5: Approval After Resubmission ✅
- [ ] Have a therapist with 1-2 rejections resubmit
- [ ] Admin approves the application
- [ ] Verify status = "approved"
- [ ] Verify rejection_reason cleared
- [ ] Verify therapist can access all features

## Database Verification

### Check Rejection Data
```sql
-- View all rejected therapists
SELECT 
    id, 
    display_name, 
    verification_status, 
    rejection_count, 
    can_resubmit, 
    rejection_reason,
    last_rejection_date
FROM therapist_profiles
WHERE verification_status = 'rejected';
```

### Check Rejection History
```sql
-- View rejection history
SELECT 
    th.id,
    tp.display_name,
    th.rejection_reason,
    th.rejected_at,
    p.full_name as rejected_by_admin
FROM therapist_rejection_history th
JOIN therapist_profiles tp ON th.therapist_id = tp.id
LEFT JOIN profiles p ON th.rejected_by = p.id
ORDER BY th.rejected_at DESC;
```

### Check Storage Policies
```sql
-- View storage policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;
```

## Rollback Plan

### If Issues Occur

**Step 1: Rollback Database**
```sql
-- Remove new columns
ALTER TABLE therapist_profiles
DROP COLUMN IF EXISTS rejection_count,
DROP COLUMN IF EXISTS rejection_reason,
DROP COLUMN IF EXISTS last_rejection_date,
DROP COLUMN IF EXISTS can_resubmit,
DROP COLUMN IF EXISTS resubmission_requested;

-- Drop rejection history table
DROP TABLE IF EXISTS therapist_rejection_history;

-- Remove new storage policies
DROP POLICY IF EXISTS "Therapists can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Therapists can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Therapists can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access" ON storage.objects;
```

**Step 2: Rollback Code**
```bash
git revert <commit-hash>
```

**Step 3: Clear Cache**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Monitoring

### What to Monitor

1. **Error Logs**
   - Watch for RLS errors in Supabase logs
   - Watch for upload failures in application logs
   - Monitor API response times

2. **Database Metrics**
   - Number of rejections per day
   - Average rejection count per therapist
   - Number of resubmissions
   - Approval rate after resubmission

3. **Storage Metrics**
   - Storage usage in `therapist-documents` bucket
   - Number of files uploaded/deleted
   - Failed upload attempts

### Queries for Monitoring

```sql
-- Rejection statistics
SELECT 
    COUNT(*) as total_rejections,
    AVG(rejection_count) as avg_rejection_count,
    MAX(rejection_count) as max_rejection_count
FROM therapist_profiles
WHERE verification_status = 'rejected';

-- Resubmission rate
SELECT 
    COUNT(*) FILTER (WHERE resubmission_requested = true) as resubmissions,
    COUNT(*) as total_rejections,
    ROUND(
        COUNT(*) FILTER (WHERE resubmission_requested = true)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) as resubmission_rate_percent
FROM therapist_profiles
WHERE verification_status = 'rejected';

-- Approval rate after resubmission
SELECT 
    COUNT(*) FILTER (WHERE verification_status = 'approved' AND rejection_count > 0) as approved_after_rejection,
    COUNT(*) FILTER (WHERE rejection_count > 0) as total_with_rejections,
    ROUND(
        COUNT(*) FILTER (WHERE verification_status = 'approved' AND rejection_count > 0)::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE rejection_count > 0), 0) * 100,
        2
    ) as approval_rate_percent
FROM therapist_profiles;
```

## Success Criteria

### Must Have (Critical)
- ✅ No RLS errors during document upload
- ✅ Rejection count increments correctly
- ✅ Old documents deleted on resubmission
- ✅ New documents uploaded successfully
- ✅ Max 3 rejections enforced
- ✅ UI displays correct status and messages

### Should Have (Important)
- ✅ Rejection history tracked in database
- ✅ Admin can view rejection reason
- ✅ Therapist can view rejection reason
- ✅ Clear error messages for validation failures
- ✅ Loading states during operations

### Nice to Have (Optional)
- ⬜ Email notifications on rejection
- ⬜ Document preview in admin panel
- ⬜ Rejection reason templates
- ⬜ Export rejection history as CSV

## Documentation

### For Developers
- [x] `STORAGE_RLS_FIX.md` - Storage policy fix details
- [x] `REJECTION_SYSTEM_COMPLETE.md` - Complete system overview
- [x] `REJECTION_FLOW_DIAGRAM.md` - Visual flow diagram
- [x] `TESTING_REJECTION_SYSTEM.md` - Testing guide

### For Deployment
- [x] `APPLY_STORAGE_FIX.md` - Quick setup guide
- [x] `FIX_RLS_ERROR_NOW.md` - Emergency fix guide
- [x] `DEPLOYMENT_CHECKLIST.md` - This file

## Final Sign-Off

- [ ] All migrations applied successfully
- [ ] All tests passed
- [ ] No console errors
- [ ] No database errors
- [ ] Storage policies verified
- [ ] Documentation complete
- [ ] Team notified

**Deployed By**: _________________
**Date**: _________________
**Environment**: _________________
**Status**: ⬜ Success  ⬜ Issues (describe below)

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
