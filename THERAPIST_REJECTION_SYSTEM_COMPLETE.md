# Therapist Rejection System - Implementation Complete

## Overview
Implemented a comprehensive therapist rejection and re-verification system that allows admins to reject therapist applications with reasons, tracks rejection history, and allows therapists to re-submit documents up to 3 times.

## Database Schema (Already Created)
Migration file: `supabase/migrations/therapist_rejection_system.sql`

### New Columns in `therapist_profiles`:
- `rejection_count` (integer, default 0)
- `rejection_reason` (text, nullable)
- `last_rejection_date` (timestamptz, nullable)
- `can_resubmit` (boolean, default true)
- `resubmission_requested` (boolean, default false)

### New Table: `therapist_rejection_history`
Tracks all rejection events with:
- `id` (uuid, primary key)
- `therapist_id` (uuid, references therapist_profiles)
- `rejection_reason` (text)
- `rejected_at` (timestamptz)
- `old_government_id_url` (text)
- `old_degree_certificate_url` (text)

## Features Implemented

### 1. Admin Side - Rejection Dialog
**File**: `app/admin/therapists/page.tsx`

- Added rejection dialog with reason input (required)
- Reject button opens modal requiring detailed reason
- Reason is stored and shown to therapist
- Rejection count incremented automatically
- After 3 rejections, `can_resubmit` set to false

### 2. Admin API - Rejection Logic
**File**: `app/api/admin/stats/route.ts`

- PATCH endpoint validates rejection reason is provided
- Increments rejection_count on each rejection
- Sets can_resubmit to false after 3 rejections
- Stores rejection history in separate table
- Clears rejection data on approval

### 3. Therapist Overview - Status Alerts
**File**: `app/therapist/overview/page.tsx`

- Shows pending verification alert (yellow)
- Shows rejection alert with reason (red)
- Displays rejection count (X/3)
- Shows "Re-submit Documents" button if can_resubmit is true
- Shows "Maximum rejection limit reached" if can_resubmit is false
- Links to re-verification page

### 4. Therapist Settings - Status Banner
**File**: `app/therapist/settings/page.tsx`

- Shows verification status at top of page
- Displays rejection reason and count
- Provides quick link to re-verification page
- Shows approved/pending/rejected status

### 5. Re-verification Page
**File**: `app/therapist/reverification/page.tsx`

**Features**:
- Only accessible to rejected therapists
- Shows rejection reason and attempt count
- Upload form for both documents (government ID + degree certificate)
- File validation (PDF, JPG, PNG only, max 5MB each)
- Prevents access if can_resubmit is false
- Success message and redirect to overview

### 6. Re-verification API
**File**: `app/api/therapists/reverification/route.ts`

**Features**:
- Validates therapist is rejected and can resubmit
- Validates file types and sizes
- Deletes old documents from storage before uploading new ones
- Uploads new documents with timestamp
- Updates therapist profile:
  - Sets verification_status back to "pending"
  - Sets resubmission_requested to true
  - Clears rejection_reason
  - Updates document URLs
- Returns success/error messages

## User Flow

### Rejection Flow:
1. Admin reviews therapist application
2. Admin clicks "Reject" button
3. Modal opens requiring rejection reason
4. Admin enters detailed reason and confirms
5. System increments rejection_count
6. System stores rejection in history table
7. System sets can_resubmit based on count (false if count >= 3)
8. Therapist sees rejection alert on next login

### Re-verification Flow:
1. Therapist sees rejection alert with reason
2. Therapist clicks "Re-submit Documents"
3. Therapist reviews rejection reason and attempt count
4. Therapist uploads new government ID and degree certificate
5. System validates files
6. System deletes old documents from storage
7. System uploads new documents
8. System sets status back to "pending"
9. Admin reviews new submission
10. Process repeats (max 3 rejections)

## Validation Rules

### Admin Side:
- Rejection reason is required (cannot be empty)
- Reason must be meaningful text

### Therapist Side:
- Both documents required for re-submission
- File types: PDF, JPG, PNG only
- Max file size: 5MB per file
- Can only resubmit if verification_status is "rejected"
- Can only resubmit if can_resubmit is true
- Maximum 3 rejection attempts

## Document Management
- Old documents are automatically deleted from Supabase storage when new ones are uploaded
- Document URLs are stored in rejection history for audit trail
- New documents use timestamp in filename to avoid conflicts

## Security
- Only authenticated therapists can access re-verification
- Only rejected therapists can submit documents
- File type and size validation on both client and server
- Admin uses service role key to bypass RLS for updates

## UI/UX Highlights
- Clear visual indicators (colors: red for rejected, yellow for pending, green for approved)
- Rejection count displayed prominently (X/3)
- Helpful error messages
- Loading states during uploads
- Success messages with auto-redirect
- Disabled states when limit reached

## Testing Checklist
- [ ] Admin can reject with reason
- [ ] Rejection reason is required
- [ ] Rejection count increments correctly
- [ ] Therapist sees rejection alert
- [ ] Therapist can access re-verification page
- [ ] File upload validation works
- [ ] Old documents are deleted
- [ ] New documents are uploaded successfully
- [ ] Status changes to pending after resubmission
- [ ] After 3 rejections, can_resubmit is false
- [ ] Therapist cannot resubmit after 3 rejections
- [ ] Admin can approve after resubmission
- [ ] Rejection data clears on approval

## Files Modified/Created

### Created:
1. `app/therapist/reverification/page.tsx` - Re-verification UI
2. `app/api/therapists/reverification/route.ts` - Re-verification API
3. `supabase/migrations/therapist_rejection_system.sql` - Database schema
4. `THERAPIST_REJECTION_SYSTEM_COMPLETE.md` - This documentation

### Modified:
1. `app/admin/therapists/page.tsx` - Added rejection dialog
2. `app/api/admin/stats/route.ts` - Added rejection logic
3. `app/therapist/overview/page.tsx` - Added rejection alerts
4. `app/therapist/settings/page.tsx` - Added status banner

## Environment Variables Required
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations (already configured)

## Next Steps (Optional Enhancements)
1. Email notifications when rejected
2. Email notifications when re-verification is reviewed
3. Admin dashboard showing resubmission queue
4. Detailed rejection history view for admins
5. Analytics on rejection reasons
6. Therapist appeal system for 3rd rejection
