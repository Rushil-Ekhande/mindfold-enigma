# Landing Page Admin Fix Summary

## Issues Fixed

### 1. Database Schema Missing Columns
- Added `is_active` column (controls section visibility)
- Added `display_order` column (controls section ordering)
- Updated default data with proper JSON structure

### 2. JSON Editor Not Editable
- Fixed state management to allow real-time editing
- Textarea now updates immediately as you type
- Added validation feedback on save
- Handles both valid and invalid JSON during editing

### 3. API Errors (500)
- Fixed API to handle missing columns gracefully
- Returns empty array instead of error to prevent frontend crashes
- Added proper error handling and logging

### 4. Active/Inactive Toggle
- Now properly saves to database
- Controls whether section appears on landing page
- Visual feedback in admin interface

## What You Need to Do

### Step 1: Run Database Migration

Go to your Supabase Dashboard → SQL Editor and run ONE of these options:

**Option A: Add Columns (if you want to keep existing data)**
```sql
ALTER TABLE landing_page_sections 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE landing_page_sections 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

UPDATE landing_page_sections SET display_order = 1 WHERE section_name = 'hero';
UPDATE landing_page_sections SET display_order = 2 WHERE section_name = 'features';
UPDATE landing_page_sections SET display_order = 3 WHERE section_name = 'how_to_use';
UPDATE landing_page_sections SET display_order = 4 WHERE section_name = 'reviews';
UPDATE landing_page_sections SET display_order = 5 WHERE section_name = 'pricing';
UPDATE landing_page_sections SET display_order = 6 WHERE section_name = 'footer';
```

**Option B: Recreate Table (fresh start with proper data)**
See the full SQL in `docs/run-migration.md`

### Step 2: Restart Your Dev Server

After running the migration:
```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 3: Test Everything

1. Visit the landing page (`/`) - should load without errors
2. Go to admin panel (`/admin/landing`)
3. Click on a section to expand
4. Edit the JSON - typing should work smoothly now
5. Toggle "Section is active" checkbox
6. Click "Save Section"
7. Refresh landing page to see changes

## How It Works Now

### Admin Interface
- **Expand/Collapse**: Click section header to edit
- **JSON Editor**: Type freely, validation happens on save
- **Active Toggle**: Check/uncheck to show/hide on landing page
- **Save Button**: Validates JSON and saves to database
- **Success Message**: Confirms save and refreshes data

### Landing Page
- Fetches only active sections from database
- Falls back to default content if API fails
- Updates in real-time when you save changes in admin

### Content Structure
Each section has specific JSON fields:
- **hero**: badge, title, titleHighlight, subtitle, ctaPrimary, ctaSecondary, stats
- **features**: heading, headingHighlight, subtitle, features array
- **how_to_use**: heading, headingHighlight, subtitle, steps array

See `docs/admin-landing-management.md` for detailed JSON examples.

## Troubleshooting

### Still seeing 500 errors?
- Make sure you ran the migration SQL
- Check Supabase logs for specific errors
- Verify columns exist: `SELECT * FROM landing_page_sections LIMIT 1;`

### Can't edit JSON?
- Try refreshing the admin page
- Check browser console for errors
- Make sure section is expanded

### Changes not appearing on landing page?
- Check if section is marked as active
- Hard refresh landing page (Ctrl+Shift+R)
- Verify JSON is valid (no syntax errors)

## Files Changed

- `app/admin/landing/page.tsx` - Fixed JSON editing
- `app/api/admin/landing/route.ts` - Fixed to use section_id and is_active
- `app/api/landing/route.ts` - New public API endpoint
- `components/landing/HeroSection.tsx` - Made dynamic
- `components/landing/FeaturesSection.tsx` - Made dynamic
- `components/landing/HowItWorksSection.tsx` - Made dynamic
- `supabase/schema.sql` - Updated table structure
- `supabase/migrations/add_landing_page_columns.sql` - Migration file
