-- ============================================================================
-- THERAPIST-USER CONNECTION FEATURES
-- Migration: Direct messaging, reviews, prescriptions
-- ============================================================================

-- ============================================================================
-- THERAPIST MESSAGES TABLE
-- Direct chat messages between therapist and patient
-- ============================================================================

CREATE TABLE IF NOT EXISTS therapist_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES therapist_patients(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_therapist_messages_relationship ON therapist_messages(relationship_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_therapist_messages_sender ON therapist_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_therapist_messages_receiver ON therapist_messages(receiver_id);

-- ============================================================================
-- THERAPIST REVIEWS TABLE
-- User reviews and ratings for therapists
-- ============================================================================

CREATE TABLE IF NOT EXISTS therapist_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES therapist_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    -- One review per user per therapist
    UNIQUE(therapist_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_therapist_reviews_therapist ON therapist_reviews(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_reviews_user ON therapist_reviews(user_id);

-- ============================================================================
-- PRESCRIPTIONS TABLE
-- Prescriptions and preventive measures from therapist to patient
-- ============================================================================

CREATE TYPE prescription_type AS ENUM ('prescription', 'preventive_measure');

CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    relationship_id UUID NOT NULL REFERENCES therapist_patients(id) ON DELETE CASCADE,
    type prescription_type NOT NULL DEFAULT 'prescription',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_user ON prescriptions(user_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_therapist ON prescriptions(therapist_id, created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE therapist_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- THERAPIST MESSAGES POLICIES
-- Users and therapists can view messages in their relationships
CREATE POLICY "Users can view their messages"
    ON therapist_messages FOR SELECT
    USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Users and therapists can send messages in their active relationships
CREATE POLICY "Users can send messages in active relationships"
    ON therapist_messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM therapist_patients
            WHERE id = therapist_messages.relationship_id
            AND is_active = true
            AND (therapist_id = auth.uid() OR user_id = auth.uid())
        )
    );

-- THERAPIST REVIEWS POLICIES
-- Anyone can view reviews for approved therapists
CREATE POLICY "Anyone can view therapist reviews"
    ON therapist_reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM therapist_profiles
            WHERE id = therapist_reviews.therapist_id
            AND verification_status = 'approved'
        )
    );

-- Users can create reviews for their therapists
CREATE POLICY "Users can create reviews"
    ON therapist_reviews FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM therapist_patients
            WHERE therapist_id = therapist_reviews.therapist_id
            AND user_id = auth.uid()
        )
    );

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
    ON therapist_reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- PRESCRIPTIONS POLICIES
-- Users can view their own prescriptions
CREATE POLICY "Users can view own prescriptions"
    ON prescriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Therapists can manage prescriptions for their patients
CREATE POLICY "Therapists can manage prescriptions"
    ON prescriptions FOR ALL
    USING (auth.uid() = therapist_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on prescriptions
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update therapist rating when a review is submitted
CREATE OR REPLACE FUNCTION update_therapist_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE therapist_profiles
    SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM therapist_reviews
        WHERE therapist_id = NEW.therapist_id
    )
    WHERE id = NEW.therapist_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_therapist_rating_on_review
    AFTER INSERT OR UPDATE ON therapist_reviews
    FOR EACH ROW EXECUTE FUNCTION update_therapist_rating();
