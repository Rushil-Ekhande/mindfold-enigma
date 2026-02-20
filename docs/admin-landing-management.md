# Admin Landing Page Management Guide

## Overview
The admin landing page management system allows administrators to dynamically edit the content of the landing page sections without touching code. Changes are stored in the database and reflected immediately on the public landing page.

## How It Works

### 1. Admin Interface (`/admin/landing`)
- View all landing page sections
- Edit section content via JSON editor
- Toggle sections active/inactive
- Changes save to database in real-time

### 2. Database Structure
Table: `landing_page_sections`
- `id`: UUID primary key
- `section_name`: Unique section identifier (hero, features, how_to_use, reviews, pricing, footer)
- `content`: JSONB field containing section data
- `display_order`: Integer for ordering sections
- `is_active`: Boolean to show/hide sections
- `updated_by`: Admin user who last updated

### 3. Active/Inactive Toggle
The "Section is active" checkbox controls whether a section appears on the landing page:
- **Active (checked)**: Section is visible to all visitors
- **Inactive (unchecked)**: Section is hidden from the landing page

This allows you to:
- Temporarily hide sections during updates
- A/B test different content
- Disable seasonal promotions
- Stage content before publishing

### 4. Content Structure by Section

#### Hero Section (`hero`)
```json
{
  "badge": "AI-Powered Mental Wellness",
  "title": "Transform Your Thoughts Into",
  "titleHighlight": "Wellness Insights",
  "subtitle": "Mindfold uses AI to analyze your daily journal entries...",
  "ctaPrimary": "Start Journaling Free",
  "ctaSecondary": "See How It Works",
  "stats": [
    { "value": "5", "label": "Wellness Metrics" },
    { "value": "AI", "label": "Powered Insights" },
    { "value": "24/7", "label": "Reflection Access" }
  ]
}
```

#### Features Section (`features`)
```json
{
  "heading": "Everything You Need for",
  "headingHighlight": "Mental Wellness",
  "subtitle": "Powerful tools designed to help you...",
  "features": [
    {
      "icon": "BookOpen",
      "title": "Smart Journaling",
      "description": "Write daily entries and receive..."
    }
  ]
}
```

Available icons: `BookOpen`, `Brain`, `BarChart3`, `MessageCircle`, `Shield`, `Users`

#### How It Works Section (`how_to_use`)
```json
{
  "heading": "How",
  "headingHighlight": "Mindfold",
  "subtitle": "Four simple steps to start your mental wellness journey.",
  "steps": [
    {
      "icon": "UserPlus",
      "step": 1,
      "title": "Create Your Account",
      "description": "Sign up in seconds..."
    }
  ]
}
```

Available icons: `UserPlus`, `PenLine`, `Sparkles`, `TrendingUp`

## Usage Instructions

### Editing Content
1. Navigate to `/admin/landing` (requires admin role)
2. Click on a section to expand the editor
3. Modify the JSON content in the textarea
4. Click "Save Section" to apply changes
5. Changes appear immediately on the landing page

### Toggling Visibility
1. Expand the section you want to hide/show
2. Check/uncheck "Section is active"
3. Click "Save Section"
4. The section will appear/disappear from the landing page

### JSON Editing Tips
- Maintain valid JSON syntax (use quotes, commas correctly)
- The editor validates JSON before saving
- Invalid JSON won't update (no error shown, just won't save)
- Use 2-space indentation for readability

## Technical Details

### API Endpoints
- `GET /api/landing` - Public endpoint, returns only active sections
- `GET /api/admin/landing` - Admin endpoint, returns all sections
- `PATCH /api/admin/landing` - Admin endpoint, updates section content

### Frontend Components
All landing components are now dynamic and fetch from the database:
- `HeroSection.tsx` - Fetches hero content
- `FeaturesSection.tsx` - Fetches features content
- `HowItWorksSection.tsx` - Fetches how_to_use content

Each component has default fallback content if the API fails.

### Security
- Only users with `role = 'admin'` in the profiles table can edit
- Public API only returns active sections
- Row Level Security (RLS) policies enforce access control

## Troubleshooting

### Changes not appearing?
1. Check if section is marked as active
2. Verify JSON is valid (no syntax errors)
3. Hard refresh the landing page (Ctrl+Shift+R)
4. Check browser console for API errors

### Can't edit content?
1. Ensure you're logged in as an admin
2. Check that your profile has `role = 'admin'`
3. Verify the section exists in the database

### Input field not working?
The textarea should now be fully editable. If it's not:
1. Check browser console for JavaScript errors
2. Ensure the section is expanded
3. Try refreshing the admin page
