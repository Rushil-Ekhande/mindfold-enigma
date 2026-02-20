-- ============================================================================
-- MINDFOLD - AI-POWERED MENTAL HEALTH TRACKING PLATFORM
-- Supabase Database Schema
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User role types
CREATE TYPE user_role AS ENUM ('user', 'therapist', 'admin');

-- Therapist verification status
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Session status
CREATE TYPE session_status AS ENUM ('requested', 'scheduled', 'completed', 'cancelled', 'postponed');

-- Subscription plan types
CREATE TYPE subscription_plan AS ENUM ('basic', 'intermediate', 'advanced');

-- Chat mode types
CREATE TYPE chat_mode AS ENUM ('quick_reflect', 'deep_reflect');

-- ============================================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with additional user information
-- ============================================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for faster role-based queries
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================================
-- USER PROFILES TABLE
-- Additional information specific to regular users
-- ============================================================================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_plan subscription_plan DEFAULT 'basic',
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    current_therapist_id UUID REFERENCES profiles(id),
    allow_therapist_access BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- THERAPIST PROFILES TABLE
-- Additional information specific to therapists
-- ============================================================================

CREATE TABLE therapist_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    display_name TEXT,
    description TEXT,
    photo_url TEXT,
    qualifications TEXT[],
    verification_status verification_status DEFAULT 'pending',
    government_id_url TEXT,
    license_number TEXT,
    degree_certificate_url TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_patients INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for verified therapists
CREATE INDEX idx_therapist_verification ON therapist_profiles(verification_status);

-- ============================================================================
-- THERAPIST SERVICES TABLE
-- Defines therapist pricing and service offerings
-- ============================================================================

CREATE TABLE therapist_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES therapist_profiles(id) ON DELETE CASCADE,
    sessions_per_week INTEGER NOT NULL,
    price_per_session DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for active services
CREATE INDEX idx_therapist_services_active ON therapist_services(therapist_id, is_active);

-- ============================================================================
-- THERAPIST TESTIMONIALS TABLE
-- Patient reviews and testimonials for therapists
-- ============================================================================

CREATE TABLE therapist_testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES therapist_profiles(id) ON DELETE CASCADE,
    testimonial_text TEXT NOT NULL,
    author_name TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- JOURNAL ENTRIES TABLE
-- Stores daily journal entries from users
-- ============================================================================

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    content TEXT NOT NULL CHECK (LENGTH(content) <= 2000),
    ai_reflection TEXT,
    -- Mental health metrics (0-100 scale)
    mental_health_score INTEGER CHECK (mental_health_score >= 0 AND mental_health_score <= 100),
    happiness_score INTEGER CHECK (happiness_score >= 0 AND happiness_score <= 100),
    accountability_score INTEGER CHECK (accountability_score >= 0 AND accountability_score <= 100),
    stress_score INTEGER CHECK (stress_score >= 0 AND stress_score <= 100),
    burnout_risk_score INTEGER CHECK (burnout_risk_score >= 0 AND burnout_risk_score <= 100),
    -- Therapist access control
    visible_to_therapist BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    -- Ensure one entry per day per user
    UNIQUE(user_id, entry_date)
);

-- Indexes for efficient queries
CREATE INDEX idx_journal_user_date ON journal_entries(user_id, entry_date DESC);
CREATE INDEX idx_journal_therapist_access ON journal_entries(user_id, visible_to_therapist);

-- ============================================================================
-- JOURNAL CHAT CONVERSATIONS TABLE
-- Stores chat conversations for "Ask Journal" feature
-- ============================================================================

CREATE TABLE journal_chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Conversation',
    chat_mode chat_mode NOT NULL DEFAULT 'quick_reflect',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for user's conversations
CREATE INDEX idx_chat_conversations_user ON journal_chat_conversations(user_id, created_at DESC);

-- ============================================================================
-- JOURNAL CHAT MESSAGES TABLE
-- Individual messages within chat conversations
-- ============================================================================

CREATE TABLE journal_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES journal_chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for conversation messages
CREATE INDEX idx_chat_messages_conversation ON journal_chat_messages(conversation_id, created_at ASC);

-- ============================================================================
-- THERAPIST PATIENT RELATIONSHIPS TABLE
-- Tracks relationships between therapists and their patients
-- ============================================================================

CREATE TABLE therapist_patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES therapist_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES therapist_services(id),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    -- Ensure unique active relationship
    UNIQUE(therapist_id, user_id, is_active)
);

-- Indexes for therapist and patient queries
CREATE INDEX idx_therapist_patients_therapist ON therapist_patients(therapist_id, is_active);
CREATE INDEX idx_therapist_patients_user ON therapist_patients(user_id, is_active);

-- ============================================================================
-- SESSION REQUESTS TABLE
-- Manages therapy session requests and scheduling
-- ============================================================================

CREATE TABLE session_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES therapist_patients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status session_status DEFAULT 'requested',
    requested_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    meeting_link TEXT,
    user_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for session queries
CREATE INDEX idx_session_requests_therapist ON session_requests(therapist_id, status);
CREATE INDEX idx_session_requests_user ON session_requests(user_id, status);

-- ============================================================================
-- SESSION NOTES TABLE
-- Therapist notes, prescriptions, and exercises from sessions
-- ============================================================================

CREATE TABLE session_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES session_requests(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    summary TEXT,
    doctors_notes TEXT,
    prescription TEXT,
    exercises TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for session notes
CREATE INDEX idx_session_notes_session ON session_notes(session_id);
CREATE INDEX idx_session_notes_user ON session_notes(user_id, created_at DESC);

-- ============================================================================
-- BILLING TRANSACTIONS TABLE
-- Tracks all payment transactions
-- ============================================================================

CREATE TABLE billing_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription', 'therapist_payment', 'refund')),
    payment_provider_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for user transactions
CREATE INDEX idx_billing_transactions_user ON billing_transactions(user_id, created_at DESC);

-- ============================================================================
-- LANDING PAGE CONTENT TABLE
-- Admin-managed content for the landing page
-- ============================================================================

CREATE TABLE landing_page_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_name TEXT UNIQUE NOT NULL CHECK (section_name IN ('navbar', 'hero', 'features', 'how_to_use', 'reviews', 'pricing', 'footer')),
    content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- ADMIN HARDCODED USER
-- Create the admin user (run after auth.users is populated)
-- ============================================================================

-- Note: This should be run after creating the admin user in Supabase Auth
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@mindfold.com';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_sections ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY "Admin can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can insert their own user profile (during signup)
CREATE POLICY "Users can insert own user profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can view their own user profile
CREATE POLICY "Users can view own user profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own user profile
CREATE POLICY "Users can update own user profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Therapists can view their patients' profiles
CREATE POLICY "Therapists can view patient profiles"
    ON user_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM therapist_patients
            WHERE therapist_patients.user_id = user_profiles.id
            AND therapist_patients.therapist_id = auth.uid()
            AND therapist_patients.is_active = true
        )
    );

-- ============================================================================
-- THERAPIST PROFILES POLICIES
-- ============================================================================

-- Therapists can insert their own profile (during registration)
CREATE POLICY "Therapists can insert own profile"
    ON therapist_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Therapists can view and update their own profile
CREATE POLICY "Therapists can manage own profile"
    ON therapist_profiles FOR ALL
    USING (auth.uid() = id);

-- Users can view approved therapists
CREATE POLICY "Users can view approved therapists"
    ON therapist_profiles FOR SELECT
    USING (verification_status = 'approved');

-- Admin can view all therapist profiles
CREATE POLICY "Admin can view all therapist profiles"
    ON therapist_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin can update therapist profiles (for verification)
CREATE POLICY "Admin can update therapist profiles"
    ON therapist_profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- JOURNAL ENTRIES POLICIES
-- ============================================================================

-- Users can manage their own journal entries
CREATE POLICY "Users can manage own journal entries"
    ON journal_entries FOR ALL
    USING (auth.uid() = user_id);

-- Therapists can view patient journal entries (if permitted)
CREATE POLICY "Therapists can view patient journal entries"
    ON journal_entries FOR SELECT
    USING (
        visible_to_therapist = true
        AND EXISTS (
            SELECT 1 FROM therapist_patients tp
            INNER JOIN user_profiles up ON tp.user_id = up.id
            WHERE tp.user_id = journal_entries.user_id
            AND tp.therapist_id = auth.uid()
            AND tp.is_active = true
            AND up.allow_therapist_access = true
        )
    );

-- ============================================================================
-- JOURNAL CHAT POLICIES
-- ============================================================================

-- Users can manage their own conversations
CREATE POLICY "Users can manage own conversations"
    ON journal_chat_conversations FOR ALL
    USING (auth.uid() = user_id);

-- Users can manage messages in their conversations
CREATE POLICY "Users can manage own messages"
    ON journal_chat_messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM journal_chat_conversations
            WHERE id = journal_chat_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

-- ============================================================================
-- SESSION REQUESTS POLICIES
-- ============================================================================

-- Users can view and create their own session requests
CREATE POLICY "Users can manage own session requests"
    ON session_requests FOR ALL
    USING (auth.uid() = user_id);

-- Therapists can view and manage session requests for their patients
CREATE POLICY "Therapists can manage patient session requests"
    ON session_requests FOR ALL
    USING (auth.uid() = therapist_id);

-- ============================================================================
-- SESSION NOTES POLICIES
-- ============================================================================

-- Users can view their own session notes
CREATE POLICY "Users can view own session notes"
    ON session_notes FOR SELECT
    USING (auth.uid() = user_id);

-- Therapists can manage session notes for their sessions
CREATE POLICY "Therapists can manage session notes"
    ON session_notes FOR ALL
    USING (auth.uid() = therapist_id);

-- ============================================================================
-- BILLING TRANSACTIONS POLICIES
-- ============================================================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
    ON billing_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Admin can view all transactions
CREATE POLICY "Admin can view all transactions"
    ON billing_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- LANDING PAGE POLICIES
-- ============================================================================

-- Everyone can view landing page content
CREATE POLICY "Anyone can view landing page"
    ON landing_page_sections FOR SELECT
    USING (true);

-- Only admin can update landing page
CREATE POLICY "Admin can update landing page"
    ON landing_page_sections FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- THERAPIST SERVICES POLICIES
-- ============================================================================

-- Therapists can manage their own services
CREATE POLICY "Therapists can manage own services"
    ON therapist_services FOR ALL
    USING (auth.uid() = therapist_id);

-- Users can view active services from approved therapists
CREATE POLICY "Users can view active therapist services"
    ON therapist_services FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM therapist_profiles
            WHERE id = therapist_services.therapist_id
            AND verification_status = 'approved'
        )
    );

-- ============================================================================
-- THERAPIST TESTIMONIALS POLICIES
-- ============================================================================

-- Therapists can manage testimonials on their profile
CREATE POLICY "Therapists can manage own testimonials"
    ON therapist_testimonials FOR ALL
    USING (auth.uid() = therapist_id);

-- Everyone can view testimonials for approved therapists
CREATE POLICY "Anyone can view testimonials"
    ON therapist_testimonials FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM therapist_profiles
            WHERE id = therapist_testimonials.therapist_id
            AND verification_status = 'approved'
        )
    );

-- ============================================================================
-- THERAPIST PATIENTS POLICIES
-- ============================================================================

-- Therapists can view their patients
CREATE POLICY "Therapists can view own patients"
    ON therapist_patients FOR SELECT
    USING (auth.uid() = therapist_id);

-- Users can view their therapist relationships
CREATE POLICY "Users can view own therapist"
    ON therapist_patients FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create therapist relationships
CREATE POLICY "Users can create therapist relationships"
    ON therapist_patients FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapist_profiles_updated_at BEFORE UPDATE ON therapist_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapist_services_updated_at BEFORE UPDATE ON therapist_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_chat_conversations_updated_at BEFORE UPDATE ON journal_chat_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_requests_updated_at BEFORE UPDATE ON session_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_notes_updated_at BEFORE UPDATE ON session_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_landing_page_sections_updated_at BEFORE UPDATE ON landing_page_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STORAGE BUCKETS (for file uploads)
-- ============================================================================

-- Note: These need to be created via Supabase Dashboard or API
-- Bucket names:
-- 1. therapist-documents (for ID, license, certificates)
-- 2. therapist-photos (for profile photos)
-- 3. user-avatars (optional, for user profile pictures)

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default landing page sections
INSERT INTO landing_page_sections (section_name, content, is_active, display_order) VALUES
('navbar', '{"brandName": "Mindfold", "links": [{"label": "Features", "href": "#features"}, {"label": "How It Works", "href": "#how-it-works"}, {"label": "Reviews", "href": "#reviews"}, {"label": "Pricing", "href": "#pricing"}], "loginText": "Log In", "signupText": "Get Started"}', true, 0),
('hero', '{"badge": "AI-Powered Mental Wellness", "title": "Transform Your Thoughts Into", "titleHighlight": "Wellness Insights", "subtitle": "Mindfold uses AI to analyze your daily journal entries, track 5 key mental health metrics, and connect you with professional therapists — all in one place.", "ctaPrimary": "Start Journaling Free", "ctaSecondary": "See How It Works", "stats": [{"value": "5", "label": "Wellness Metrics"}, {"value": "AI", "label": "Powered Insights"}, {"value": "24/7", "label": "Reflection Access"}]}', true, 1),
('features', '{"heading": "Everything You Need for", "headingHighlight": "Mental Wellness", "subtitle": "Powerful tools designed to help you understand yourself better and take control of your mental health journey.", "features": [{"icon": "BookOpen", "title": "Smart Journaling", "description": "Write daily entries and receive instant AI-generated reflections that help you understand your emotional patterns."}, {"icon": "Brain", "title": "Mental Health Metrics", "description": "Track 5 key metrics — mental health, happiness, accountability, stress, and burnout risk — scored from every entry."}, {"icon": "BarChart3", "title": "Visual Analytics", "description": "Beautiful graphs and charts that show your wellness trends over time, helping you spot patterns and celebrate progress."}, {"icon": "MessageCircle", "title": "Ask Your Journal", "description": "Chat with an AI that has read your journal. Ask questions like Why do I feel stressed on Mondays? and get real answers."}, {"icon": "Users", "title": "Therapist Connect", "description": "Browse verified therapists, book sessions, and share selected journal entries for more personalized professional support."}, {"icon": "Shield", "title": "Privacy First", "description": "Full control over what your therapist can see. Toggle visibility per entry, or disable sharing entirely."}]}', true, 2),
('how_to_use', '{"heading": "How", "headingHighlight": "Mindfold", "subtitle": "Four simple steps to start your mental wellness journey.", "steps": [{"icon": "UserPlus", "step": 1, "title": "Create Your Account", "description": "Sign up in seconds with just your name, email, and password. No credit card required to get started."}, {"icon": "PenLine", "step": 2, "title": "Write Daily Entries", "description": "Journal about your day in up to 2000 characters. Our clean editor makes it easy to express your thoughts."}, {"icon": "Sparkles", "step": 3, "title": "Get AI Insights", "description": "Our AI instantly analyzes your entry, generates a reflection, and scores 5 mental health metrics."}, {"icon": "TrendingUp", "step": 4, "title": "Track Your Progress", "description": "Watch your metrics improve over time. Ask your journal questions and connect with therapists for deeper support."}]}', true, 3),
('reviews', '{"heading": "Loved by", "headingHighlight": "Thousands", "subtitle": "See what our users and therapists are saying about Mindfold.", "reviews": [{"name": "Sarah M.", "role": "Daily Journaler", "content": "Mindfold has completely changed how I understand my emotions. The AI reflections are surprisingly insightful — it is like having a therapist in my pocket.", "rating": 5}, {"name": "James L.", "role": "Mental Health Advocate", "content": "The Ask Journal feature is a game-changer. I asked why I keep procrastinating and it gave me patterns I never noticed. Highly recommend!", "rating": 5}, {"name": "Dr. Emily R.", "role": "Licensed Therapist", "content": "As a therapist on the platform, I love how patients can share specific entries with me. The metrics give me a head start before each session.", "rating": 5}, {"name": "Michael K.", "role": "Software Engineer", "content": "The burnout risk metric literally saved me. I could see my scores declining and took action before things got worse. Simple but powerful.", "rating": 4}, {"name": "Priya S.", "role": "Graduate Student", "content": "I love the calendar view for my journal. Being able to look back at any day and see my metrics side by side is incredibly useful.", "rating": 5}, {"name": "Tom H.", "role": "Entrepreneur", "content": "The deep reflect mode blew my mind. It analyzed months of entries and found patterns in my stress that I had been completely blind to.", "rating": 5}]}', true, 4),
('pricing', '{"heading": "Simple, Transparent", "headingHighlight": "Pricing", "subtitle": "Choose the plan that works best for your wellness journey.", "plans": [{"name": "Basic", "price": 9.99, "features": ["Daily journaling", "AI reflections", "5 wellness metrics", "7-day history"], "highlighted": false}, {"name": "Intermediate", "price": 14.99, "features": ["Everything in Basic", "Ask your journal", "30-day history", "Therapist connect", "Priority support"], "highlighted": true}, {"name": "Advanced", "price": 24.99, "features": ["Everything in Intermediate", "Unlimited history", "Deep reflect mode", "Custom metrics", "API access"], "highlighted": false}]}', true, 5),
('footer', '{"brandDescription": "AI-powered mental health tracking and reflective journaling platform that transforms daily thoughts into measurable wellness insights.", "columns": [{"title": "Product", "links": [{"label": "Features", "href": "#features"}, {"label": "Pricing", "href": "#pricing"}, {"label": "How It Works", "href": "#how-it-works"}, {"label": "Reviews", "href": "#reviews"}]}, {"title": "Company", "links": [{"label": "About", "href": "#"}, {"label": "Privacy Policy", "href": "#"}, {"label": "Terms of Service", "href": "#"}, {"label": "Contact", "href": "#"}]}, {"title": "For Therapists", "links": [{"label": "Join as Therapist", "href": "/auth/therapist-register"}, {"label": "Therapist Guidelines", "href": "#"}, {"label": "Support", "href": "#"}]}], "copyright": "© 2026 Mindfold. All rights reserved."}', true, 6);

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. After deploying this schema, create an admin user in Supabase Auth
--    and then run: UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
--
-- 2. Create storage buckets in Supabase Dashboard:
--    - therapist-documents (private)
--    - therapist-photos (public)
--    - user-avatars (public)
--
-- 3. Configure storage policies for file uploads
--
-- 4. Set up Supabase Edge Functions for:
--    - AI analysis of journal entries (Google Flash 2.5)
--    - Mental health metrics calculation
--    - Chat functionality with journal context
--
-- 5. Integrate Dodo payment provider in your Next.js backend
--
-- 6. Remember to set up proper environment variables for:
--    - Supabase URL and keys
--    - Google AI API keys
--    - Payment provider credentials
--
-- ============================================================================
