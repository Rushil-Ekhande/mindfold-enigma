# Admin Landing Page - Quick Reference

## Quick Start

1. **Access**: Go to `/admin/landing` (must be logged in as admin)
2. **Edit**: Click any section to expand the JSON editor
3. **Save**: Make changes and click "Save Section"
4. **View**: Refresh landing page to see changes

## All Sections at a Glance

| Section | Key Fields | Icons Available |
|---------|-----------|-----------------|
| **navbar** | brandName, links, loginText, signupText | - |
| **hero** | badge, title, titleHighlight, subtitle, ctaPrimary, ctaSecondary, stats | - |
| **features** | heading, headingHighlight, subtitle, features[] | BookOpen, Brain, BarChart3, MessageCircle, Shield, Users |
| **how_to_use** | heading, headingHighlight, subtitle, steps[] | UserPlus, PenLine, Sparkles, TrendingUp |
| **reviews** | heading, headingHighlight, subtitle, reviews[] | - |
| **pricing** | heading, headingHighlight, subtitle, plans[] | - |
| **footer** | brandDescription, columns[], copyright | - |

## Common Tasks

### Change Hero Headline
```json
{
  "title": "Your New Title",
  "titleHighlight": "Highlighted Part"
}
```

### Add a Feature
Add to the `features` array:
```json
{
  "icon": "Brain",
  "title": "New Feature",
  "description": "Feature description here"
}
```

### Update Pricing
```json
{
  "plans": [
    {
      "name": "Plan Name",
      "price": 19.99,
      "features": ["Feature 1", "Feature 2"],
      "highlighted": true
    }
  ]
}
```

### Add a Review
```json
{
  "reviews": [
    {
      "name": "John D.",
      "role": "User Role",
      "content": "Review text here",
      "rating": 5
    }
  ]
}
```

### Hide a Section Temporarily
1. Expand the section
2. Uncheck "Section is active"
3. Click "Save Section"
4. Section disappears from landing page

## JSON Tips

- Use double quotes for strings: `"text"`
- Numbers don't need quotes: `5` or `19.99`
- Booleans: `true` or `false`
- Arrays use square brackets: `[...]`
- Objects use curly braces: `{...}`
- Separate items with commas
- No comma after the last item

## Validation

The editor validates JSON when you save:
- ✅ Valid JSON = Saves successfully
- ❌ Invalid JSON = Shows error message
- You can type freely; validation happens on save

## Best Practices

1. **Test changes**: Save and refresh landing page to verify
2. **Keep backups**: Copy JSON before major changes
3. **Use staging**: Mark section inactive while editing
4. **Be consistent**: Match tone and style across sections
5. **Mobile-friendly**: Keep text concise for mobile users

## Emergency Reset

If something breaks, you can reset a section to defaults:

1. Go to Supabase Dashboard > SQL Editor
2. Run: `SELECT content FROM landing_page_sections WHERE section_name = 'hero';`
3. Copy the default JSON from `supabase/schema.sql`
4. Paste into admin editor and save

## Support

- Full documentation: `docs/admin-landing-management.md`
- All sections guide: `ALL_LANDING_SECTIONS_DYNAMIC.md`
- Technical details: `LANDING_PAGE_FIX.md`
