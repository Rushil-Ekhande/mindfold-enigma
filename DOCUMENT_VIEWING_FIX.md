# Document Viewing Fix - Bucket Not Found & Filename Issues

## Problems Fixed

### Problem 1: "Bucket not found" Error (404)
**Error**: `{"statusCode": "404", "error": "Bucket not found", "message": "Bucket not found"}`

**Root Cause**: 
- The system was storing signed URLs in the database
- Signed URLs expire after a set time (1 hour in registration, 1 year in re-verification)
- When admin tried to view documents later, the URLs were expired
- Expired signed URLs return 404 errors

### Problem 2: Filenames Changed to Numbers
**Issue**: Files were being saved with timestamps instead of original names
- Example: `government_id_1708473600.pdf` instead of `government_id_Passport.pdf`

---

## Solution Implemented

### 1. Store Paths, Not URLs
**Before**:
```typescript
// Stored signed URL in database (expires!)
government_id_url: "https://...supabase.co/storage/v1/object/sign/..."
```

**After**:
```typescript
// Store file path in database (never expires)
government_id_url: "temp/government_id_Passport.pdf"
// or
government_id_url: "{user_id}/government_id_Passport.pdf"
```

### 2. Generate Fresh Signed URLs On-Demand
When admin views therapists, the API now:
1. Fetches therapist data with file paths
2. Generates fresh signed URLs (valid for 1 hour)
3. Returns data with working URLs

**Code in `/api/admin/therapists`**:
```typescript
// Check if it's a path (not already a URL)
if (govIdUrl && !govIdUrl.startsWith('http')) {
    // Generate fresh signed URL
    const { data: signedData } = await supabase.storage
        .from("therapist-documents")
        .createSignedUrl(govIdUrl, 3600); // 1 hour
    if (signedData?.signedUrl) {
        govIdUrl = signedData.signedUrl;
    }
}
```

### 3. Preserve Original Filenames
**Before**:
```typescript
const govIdPath = `${user.id}/government_id_${timestamp}.${ext}`;
// Result: {user_id}/government_id_1708473600.pdf
```

**After**:
```typescript
const sanitizeFilename = (filename: string) => {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};
const govIdOriginalName = sanitizeFilename(governmentIdFile.name);
const govIdPath = `${user.id}/government_id_${govIdOriginalName}`;
// Result: {user_id}/government_id_Passport.pdf
```

---

## Files Modified

### 1. Re-verification API
**File**: `app/api/therapists/reverification/route.ts`

**Changes**:
- Preserve original filenames with sanitization
- Store file paths instead of signed URLs
- Use `upsert: true` to allow overwriting

### 2. Admin Therapists API
**File**: `app/api/admin/therapists/route.ts`

**Changes**:
- Generate fresh signed URLs when fetching therapists
- Check if value is a path or URL before generating
- Return working URLs to frontend

### 3. Therapist Registration
**File**: `app/auth/therapist-register/page.tsx`

**Changes**:
- Store file paths instead of signed URLs
- Preserve original filenames
- Remove timestamp from filename

---

## Storage Structure

### Before (Broken)
```
therapist-documents/
└── temp/
    ├── Passport.pdf-1708473600
    └── Degree.pdf-1708473601
```

### After (Fixed)
```
therapist-documents/
├── temp/                                    (initial registration)
│   ├── government_id_Passport.pdf
│   └── degree_certificate_Degree.pdf
│
└── {user_id}/                              (after approval or re-verification)
    ├── government_id_Passport.pdf
    └── degree_certificate_Degree.pdf
```

---

## Database Schema

### Column: `government_id_url` and `degree_certificate_url`

**Before**: Stored signed URLs (expire)
```
https://project.supabase.co/storage/v1/object/sign/therapist-documents/...?token=...
```

**After**: Store file paths (never expire)
```
temp/government_id_Passport.pdf
or
473c5fde-aea6-4ae6-95ae-4b9813be0cdd/government_id_Passport.pdf
```

---

## How It Works Now

### Registration Flow
1. Therapist uploads documents
2. Files saved to `temp/government_id_{original_name}`
3. File PATH stored in database (not URL)
4. Admin views therapist → API generates fresh signed URL

### Re-verification Flow
1. Therapist uploads new documents
2. Old files deleted from storage
3. New files saved to `{user_id}/government_id_{original_name}`
4. File PATH stored in database (not URL)
5. Admin views therapist → API generates fresh signed URL

### Viewing Flow
1. Admin opens therapists page
2. Frontend calls `/api/admin/therapists`
3. API fetches therapist data (has file paths)
4. API generates fresh signed URLs (valid 1 hour)
5. Frontend receives working URLs
6. Admin clicks link → document opens ✅

---

## Benefits

### 1. No More 404 Errors
- Signed URLs generated fresh every time
- Always valid when admin views them

### 2. Original Filenames Preserved
- Easy to identify documents
- Better for admin review

### 3. Cleaner Storage
- No duplicate files with timestamps
- Files can be overwritten during re-verification

### 4. Better Security
- Signed URLs expire after 1 hour
- Can't share permanent links to documents
- Each view generates new temporary URL

---

## Testing

### Test 1: View Documents After Registration
1. Register as therapist with documents
2. Login as admin
3. Go to `/admin/therapists`
4. Click "Government ID" or "Degree Certificate"
5. Document should open ✅

### Test 2: View Documents After Re-verification
1. Reject a therapist
2. Therapist re-uploads documents
3. Login as admin
4. View the therapist's documents
5. Should see new documents with original filenames ✅

### Test 3: View Documents After Long Time
1. Register therapist (wait 2+ hours)
2. Login as admin
3. View documents
4. Should still work (fresh URLs generated) ✅

### Test 4: Filename Preservation
1. Upload file named "My_Passport_2024.pdf"
2. Check storage: should be "government_id_My_Passport_2024.pdf"
3. Not "government_id_1708473600.pdf" ✅

---

## Migration Notes

### For Existing Data
If you have existing therapists with signed URLs in the database, they will continue to work until the URLs expire. After expiry:

**Option 1**: Manual fix (recommended)
- Admin re-approves or rejects therapist
- Therapist re-uploads documents
- New paths stored

**Option 2**: Database migration
```sql
-- This would require extracting paths from existing URLs
-- Not recommended as URLs may already be expired
```

### For New Registrations
All new registrations will automatically use the new system.

---

## Troubleshooting

### Issue: Still Getting 404
**Check**:
1. Is the bucket name correct? (`therapist-documents`)
2. Does the file exist in storage?
3. Is the path in database correct?
4. Are storage policies applied?

**Solution**: Check storage in Supabase Dashboard

### Issue: Filename Still Has Timestamp
**Check**: Are you using the updated code?

**Solution**: Clear cache and rebuild
```bash
rm -rf .next
npm run build
```

### Issue: Can't View Documents
**Check**: Storage RLS policies

**Solution**: Apply `fix_storage_reverification.sql` migration

---

## Summary

✅ **Fixed**: Bucket not found error (404)  
✅ **Fixed**: Filenames changed to numbers  
✅ **Improved**: Security with expiring signed URLs  
✅ **Improved**: Storage organization  
✅ **Improved**: Admin experience with readable filenames  

**Status**: Production ready
