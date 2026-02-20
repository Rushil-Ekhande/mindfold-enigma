# Testing the Therapist Rejection System

## Prerequisites
1. Run the migrations in order:
   - `supabase/migrations/therapist_rejection_system.sql`
   - `supabase/migrations/fix_storage_reverification.sql` (IMPORTANT: Fixes RLS for file uploads)
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`
3. Have at least one pending therapist application
4. Verify storage bucket `therapist-documents` exists in Supabase

## Test Scenarios

### Scenario 1: First Rejection
**Steps**:
1. Login as admin
2. Navigate to `/admin/therapists`
3. Find a pending therapist
4. Click "Reject" button
5. Enter rejection reason: "Documents are unclear, please resubmit with better quality"
6. Click "Confirm Rejection"

**Expected Results**:
- Therapist card moves to "rejected" tab
- Rejection count: 1/3
- Status changes to "rejected"

**Therapist Side**:
1. Login as the rejected therapist
2. Navigate to `/therapist/overview`
3. Should see red rejection alert with reason
4. Should see "Re-submit Documents" button
5. Click button to go to `/therapist/reverification`

### Scenario 2: Re-submission
**Steps** (as therapist):
1. On `/therapist/reverification` page
2. Review rejection reason
3. Upload new government ID (PDF/JPG/PNG, max 5MB)
4. Upload new degree certificate (PDF/JPG/PNG, max 5MB)
5. Click "Submit for Re-verification"

**Expected Results**:
- Success message appears
- Redirects to `/therapist/overview`
- Status changes to "pending"
- Old documents deleted from storage
- New documents uploaded
- **NO RLS ERRORS** (fixed by `fix_storage_reverification.sql` migration)

**Admin Side**:
1. Navigate to `/admin/therapists`
2. Therapist should appear in "pending" tab again
3. Can review new documents

### Scenario 3: Second Rejection
**Steps** (as admin):
1. Reject the therapist again with reason: "Degree certificate is not from an accredited institution"
2. Confirm rejection

**Expected Results**:
- Rejection count: 2/3
- Therapist can still resubmit

**Therapist Side**:
1. Should see rejection count: 2/3
2. Should still see "Re-submit Documents" button

### Scenario 4: Third Rejection (Final)
**Steps** (as admin):
1. Reject the therapist a third time with reason: "Credentials could not be verified"
2. Confirm rejection

**Expected Results**:
- Rejection count: 3/3
- `can_resubmit` set to false

**Therapist Side**:
1. Should see rejection count: 3/3
2. Should see "Maximum rejection limit reached" message
3. "Re-submit Documents" button should NOT appear
4. Cannot access `/therapist/reverification` (shows error)

### Scenario 5: Approval After Resubmission
**Steps** (as admin):
1. Have a therapist with 1-2 rejections resubmit documents
2. Review new documents
3. Click "Approve" button

**Expected Results**:
- Status changes to "approved"
- Rejection reason cleared
- Therapist can now accept patients

**Therapist Side**:
1. Should see green "Verified" status
2. No rejection alerts
3. Can access all therapist features

## Edge Cases to Test

### Edge Case 1: File Validation
**Test**: Try uploading invalid files
- Upload .txt file → Should show error
- Upload file > 5MB → Should show error
- Upload only one document → Should show error

### Edge Case 2: Unauthorized Access
**Test**: Try accessing re-verification when not rejected
1. Login as approved therapist
2. Navigate to `/therapist/reverification`
3. Should see "No Re-verification Needed" message

### Edge Case 3: Empty Rejection Reason
**Test**: Try rejecting without reason
1. Click "Reject" button
2. Leave reason field empty
3. Click "Confirm Rejection"
4. Should show alert: "Please provide a reason for rejection"

### Edge Case 4: Concurrent Rejections
**Test**: Multiple admins rejecting same therapist
1. Have two admin accounts open
2. Both try to reject same therapist
3. Should handle gracefully (count should be accurate)

## Database Verification

### Check Rejection Count
```sql
SELECT id, display_name, verification_status, rejection_count, can_resubmit, rejection_reason
FROM therapist_profiles
WHERE verification_status = 'rejected';
```

### Check Rejection History
```sql
SELECT * FROM therapist_rejection_history
ORDER BY rejected_at DESC;
```

### Check Document URLs
```sql
SELECT id, display_name, government_id_url, degree_certificate_url
FROM therapist_profiles
WHERE verification_status = 'rejected';
```

## Storage Verification

### Check Old Documents Deleted
1. Note document URLs before resubmission
2. After resubmission, try accessing old URLs
3. Should return 404 or "not found"

### Check New Documents Uploaded
1. After resubmission, check new document URLs
2. Should be accessible
3. Should have timestamp in filename

## UI/UX Checks

### Admin Dashboard
- [ ] Rejection dialog appears on click
- [ ] Rejection reason is required
- [ ] Loading state during rejection
- [ ] Success feedback after rejection
- [ ] Therapist moves to correct tab

### Therapist Overview
- [ ] Rejection alert is prominent (red)
- [ ] Rejection reason is displayed
- [ ] Rejection count is visible (X/3)
- [ ] Re-submit button appears when can_resubmit is true
- [ ] Re-submit button hidden when can_resubmit is false
- [ ] Max rejection message appears after 3 rejections

### Therapist Settings
- [ ] Verification status banner at top
- [ ] Shows correct status (pending/approved/rejected)
- [ ] Rejection info displayed if rejected
- [ ] Link to re-verification page

### Re-verification Page
- [ ] Shows rejection reason
- [ ] Shows rejection count
- [ ] File upload works
- [ ] File validation works
- [ ] Loading state during upload
- [ ] Success message appears
- [ ] Redirects after success
- [ ] Blocked if can_resubmit is false

## Performance Checks
- [ ] Document deletion doesn't block upload
- [ ] Large files (up to 5MB) upload successfully
- [ ] Page loads quickly even with rejection history
- [ ] No memory leaks in file upload

## Security Checks
- [ ] Only admins can reject therapists
- [ ] Only rejected therapists can access re-verification
- [ ] File type validation on server side
- [ ] File size validation on server side
- [ ] SQL injection protection (using Supabase client)
- [ ] XSS protection (React escapes by default)

## Rollback Plan
If issues occur:
1. Revert migration: Drop new columns and table
2. Revert code changes: Use git to restore previous versions
3. Clear any stuck states in database

## Success Criteria
✅ Admin can reject with reason
✅ Rejection count increments correctly
✅ Therapist sees rejection alerts
✅ Therapist can resubmit documents
✅ Old documents are deleted
✅ New documents are uploaded
✅ After 3 rejections, resubmission is blocked
✅ Admin can approve after resubmission
✅ All UI elements display correctly
✅ No console errors
✅ No database errors
