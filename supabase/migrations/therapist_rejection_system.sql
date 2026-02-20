-- ============================================================================
-- Migration: Therapist Rejection & Re-verification System
-- ============================================================================

-- Add columns to track rejections and re-verification
ALTER TABLE therapist_profiles
ADD COLUMN IF NOT EXISTS rejection_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS last_rejection_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS can_resubmit BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS resubmission_requested BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN therapist_profiles.rejection_count IS 'Number of times verification has been rejected. Max 3 attempts allowed.';
COMMENT ON COLUMN therapist_profiles.rejection_reason IS 'Admin-provided reason for the most recent rejection.';
COMMENT ON COLUMN therapist_profiles.last_rejection_date IS 'Timestamp of the most recent rejection.';
COMMENT ON COLUMN therapist_profiles.can_resubmit IS 'Whether therapist can resubmit documents. False after 3 rejections.';
COMMENT ON COLUMN therapist_profiles.resubmission_requested IS 'Whether therapist has requested to resubmit documents after rejection.';

-- Create a table to track rejection history
CREATE TABLE IF NOT EXISTS therapist_rejection_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES therapist_profiles(id) ON DELETE CASCADE,
    rejection_reason TEXT NOT NULL,
    rejected_by UUID REFERENCES profiles(id),
    rejected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    old_government_id_url TEXT,
    old_degree_certificate_url TEXT
);

-- Index for querying rejection history
CREATE INDEX IF NOT EXISTS idx_rejection_history_therapist 
ON therapist_rejection_history(therapist_id, rejected_at DESC);

-- Enable RLS
ALTER TABLE therapist_rejection_history ENABLE ROW LEVEL SECURITY;

-- Therapists can view their own rejection history
CREATE POLICY "Therapists can view own rejection history"
    ON therapist_rejection_history FOR SELECT
    TO authenticated
    USING (
        therapist_id IN (
            SELECT id FROM therapist_profiles WHERE id = auth.uid()
        )
    );

-- Admin can view all rejection history
CREATE POLICY "Admin can view all rejection history"
    ON therapist_rejection_history FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin can insert rejection history (via service role)
CREATE POLICY "Admin can insert rejection history"
    ON therapist_rejection_history FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Update existing rejected therapists to have rejection_count = 1
UPDATE therapist_profiles 
SET rejection_count = 1, 
    can_resubmit = true,
    last_rejection_date = updated_at
WHERE verification_status = 'rejected' 
AND rejection_count = 0;

COMMENT ON TABLE therapist_rejection_history IS 'Tracks all rejection events for therapists, including reasons and old document URLs.';
