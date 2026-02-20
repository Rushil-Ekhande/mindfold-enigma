# Therapist Rejection & Re-verification Flow

## Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     THERAPIST REGISTRATION                          │
│                                                                     │
│  Therapist submits application with documents                      │
│  Status: "pending"                                                  │
│  Documents stored in: therapist-documents/{user_id}/*              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ADMIN REVIEW                                   │
│                                                                     │
│  Admin views application at /admin/therapists                      │
│  Reviews documents and credentials                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌───────────────────┐   ┌───────────────────┐
        │     APPROVE       │   │      REJECT       │
        │                   │   │                   │
        │ Status: approved  │   │ Status: rejected  │
        │ Can accept        │   │ rejection_count++ │
        │ patients          │   │ Store reason      │
        └───────────────────┘   └───────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────┐
                        │  THERAPIST SEES REJECTION       │
                        │                                 │
                        │  At /therapist/overview:        │
                        │  - Red alert with reason        │
                        │  - Rejection count (X/3)        │
                        │  - "Re-submit Documents" button │
                        └─────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────┐
                        │  Check: can_resubmit?           │
                        └─────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
        ┌───────────────────┐   ┌───────────────────────┐
        │  YES (< 3 rejects)│   │  NO (3 rejections)    │
        │                   │   │                       │
        │  Show re-verify   │   │  Show "Max limit      │
        │  page             │   │  reached" message     │
        └───────────────────┘   │                       │
                    │            │  Block access to      │
                    │            │  re-verification      │
                    │            │                       │
                    │            │  Must contact support │
                    │            └───────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  RE-VERIFICATION PAGE                               │
│                  /therapist/reverification                          │
│                                                                     │
│  1. Display rejection reason                                        │
│  2. Display rejection count (X/3)                                   │
│  3. Upload new Government ID                                        │
│  4. Upload new Degree Certificate                                   │
│  5. Validate files (type, size)                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  DOCUMENT REPLACEMENT                               │
│                  /api/therapists/reverification                     │
│                                                                     │
│  1. Delete old documents from storage                               │
│     - government_id_url                                             │
│     - degree_certificate_url                                        │
│                                                                     │
│  2. Upload new documents                                            │
│     - {user_id}/government_id_{timestamp}.ext                       │
│     - {user_id}/degree_certificate_{timestamp}.ext                  │
│                                                                     │
│  3. Update therapist_profiles:                                      │
│     - government_id_url = new URL                                   │
│     - degree_certificate_url = new URL                              │
│     - verification_status = "pending"                               │
│     - resubmission_requested = true                                 │
│     - rejection_reason = null                                       │
│                                                                     │
│  4. Storage RLS Policies (FIXED):                                   │
│     ✅ Therapists can upload to own folder                          │
│     ✅ Therapists can delete own documents                          │
│     ✅ Service role has full access                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  BACK TO ADMIN REVIEW                               │
│                                                                     │
│  Therapist appears in "pending" tab again                           │
│  Admin can review new documents                                     │
│  Cycle repeats (max 3 times)                                        │
└─────────────────────────────────────────────────────────────────────┘
```

## Rejection Count Logic

```
Attempt 1: rejection_count = 1, can_resubmit = true  ✅ Can resubmit
Attempt 2: rejection_count = 2, can_resubmit = true  ✅ Can resubmit
Attempt 3: rejection_count = 3, can_resubmit = false ❌ Cannot resubmit
```

## Storage Structure

```
therapist-documents/
├── temp/                          (registration uploads)
│   ├── government_id_123.pdf
│   └── degree_cert_456.pdf
│
└── {user_id}/                     (verified therapist documents)
    ├── government_id_1708473600.pdf
    └── degree_certificate_1708473600.pdf
```

## RLS Policies Applied

### Before Fix (❌ Broken)
```
❌ Can only upload to temp/
❌ Cannot upload to {user_id}/*
❌ Cannot delete old documents
Result: RLS error during re-verification
```

### After Fix (✅ Working)
```
✅ Can upload to temp/ (registration)
✅ Can upload to {user_id}/* (re-verification)
✅ Can delete own documents
✅ Service role has full access
Result: Re-verification works perfectly
```

## Database Tables

### therapist_profiles (updated)
```sql
id                      UUID
verification_status     TEXT (pending/approved/rejected)
rejection_count         INTEGER (0-3)
rejection_reason        TEXT
last_rejection_date     TIMESTAMP
can_resubmit           BOOLEAN
resubmission_requested BOOLEAN
government_id_url      TEXT
degree_certificate_url TEXT
```

### therapist_rejection_history (new)
```sql
id                         UUID
therapist_id              UUID
rejection_reason          TEXT
rejected_by               UUID (admin)
rejected_at               TIMESTAMP
old_government_id_url     TEXT
old_degree_certificate_url TEXT
```

## API Endpoints

### Admin
- `PATCH /api/admin/stats` - Reject with reason
- `GET /api/admin/therapists` - List all therapists

### Therapist
- `GET /api/therapists/settings` - Get status
- `POST /api/therapists/reverification` - Resubmit docs

## Key Features

1. ✅ **Rejection Tracking** - Count and history
2. ✅ **Document Management** - Auto-delete old, upload new
3. ✅ **Attempt Limiting** - Max 3 rejections
4. ✅ **Storage Security** - RLS policies enforced
5. ✅ **Audit Trail** - Rejection history table
6. ✅ **Clear UI/UX** - Alerts, counters, messages

## Success Criteria

- ✅ No RLS errors during upload
- ✅ Old documents deleted automatically
- ✅ Rejection count accurate
- ✅ UI shows correct status
- ✅ Max 3 attempts enforced
- ✅ Admin can approve after resubmission
