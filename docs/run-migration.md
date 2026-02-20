# Running the Landing Page Migration

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/add_landing_page_columns.sql`
5. Click **Run** to execute the migration

## Option 2: Recreate the Table (If you have no important data)

If the landing_page_sections table is empty or you're okay with resetting it:

1. Go to Supabase Dashboard > **SQL Editor**
2. Run this query to drop and recreate:

```sql
-- Drop the existing table
DROP TABLE IF EXISTS landing_page_sections CASCADE;

-- Recreate with new structure
CREATE TABLE landing_page_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_name TEXT UNIQUE NOT NULL CHECK (section_name IN ('hero', 'features', 'how_to_use', 'reviews', 'pricing', 'footer')),
    content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE landing_page_sections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view landing page"
    ON landing_page_sections FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admin can update landing page"
    ON landing_page_sections FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_landing_page_sections_updated_at 
    BEFORE UPDATE ON landing_page_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO landing_page_sections (section_name, content, is_active, display_order) VALUES
('hero', '{"badge": "AI-Powered Mental Wellness", "title": "Transform Your Thoughts Into", "titleHighlight": "Wellness Insights", "subtitle": "Mindfold uses AI to analyze your daily journal entries, track 5 key mental health metrics, and connect you with professional therapists — all in one place.", "ctaPrimary": "Start Journaling Free", "ctaSecondary": "See How It Works", "stats": [{"value": "5", "label": "Wellness Metrics"}, {"value": "AI", "label": "Powered Insights"}, {"value": "24/7", "label": "Reflection Access"}]}', true, 1),
('features', '{"heading": "Everything You Need for", "headingHighlight": "Mental Wellness", "subtitle": "Powerful tools designed to help you understand yourself better and take control of your mental health journey.", "features": [{"icon": "BookOpen", "title": "Smart Journaling", "description": "Write daily entries and receive instant AI-generated reflections that help you understand your emotional patterns."}, {"icon": "Brain", "title": "Mental Health Metrics", "description": "Track 5 key metrics — mental health, happiness, accountability, stress, and burnout risk — scored from every entry."}, {"icon": "BarChart3", "title": "Visual Analytics", "description": "Beautiful graphs and charts that show your wellness trends over time, helping you spot patterns and celebrate progress."}, {"icon": "MessageCircle", "title": "Ask Your Journal", "description": "Chat with an AI that has read your journal. Ask questions like Why do I feel stressed on Mondays? and get real answers."}, {"icon": "Users", "title": "Therapist Connect", "description": "Browse verified therapists, book sessions, and share selected journal entries for more personalized professional support."}, {"icon": "Shield", "title": "Privacy First", "description": "Full control over what your therapist can see. Toggle visibility per entry, or disable sharing entirely."}]}', true, 2),
('how_to_use', '{"heading": "How", "headingHighlight": "Mindfold", "subtitle": "Four simple steps to start your mental wellness journey.", "steps": [{"icon": "UserPlus", "step": 1, "title": "Create Your Account", "description": "Sign up in seconds with just your name, email, and password. No credit card required to get started."}, {"icon": "PenLine", "step": 2, "title": "Write Daily Entries", "description": "Journal about your day in up to 2000 characters. Our clean editor makes it easy to express your thoughts."}, {"icon": "Sparkles", "step": 3, "title": "Get AI Insights", "description": "Our AI instantly analyzes your entry, generates a reflection, and scores 5 mental health metrics."}, {"icon": "TrendingUp", "step": 4, "title": "Track Your Progress", "description": "Watch your metrics improve over time. Ask your journal questions and connect with therapists for deeper support."}]}', true, 3),
('reviews', '{"reviews": [{"name": "User 1", "review": "Life-changing platform", "rating": 5}]}', true, 4),
('pricing', '{"plans": [{"name": "Basic", "price": 9.99, "features": []}, {"name": "Intermediate", "price": 14.99, "features": []}, {"name": "Advanced", "price": 24.99, "features": []}]}', true, 5),
('footer', '{"copyright": "© 2026 Mindfold. All rights reserved.", "links": []}', true, 6);
```

## After Running Migration

1. Refresh your Next.js app (the landing page should now load without errors)
2. Go to `/admin/landing` to test editing
3. The JSON editor should now be fully editable
4. The "Section is active" checkbox will control visibility

## Troubleshooting

If you still see errors:
- Check the Supabase logs in the dashboard
- Verify the columns exist: `SELECT * FROM landing_page_sections LIMIT 1;`
- Make sure your user has admin role: `SELECT role FROM profiles WHERE id = auth.uid();`
