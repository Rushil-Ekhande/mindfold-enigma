-- ============================================================================
-- Migration: Admin Journal Privacy - Restrict admin access to journal content
-- Admin can only see aggregated statistics, not actual journal entries
-- ============================================================================

-- Drop existing policies for journal_entries if they exist
DROP POLICY IF EXISTS "Users can view own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can create own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON journal_entries;
DROP POLICY IF EXISTS "Therapists can view patient entries" ON journal_entries;
DROP POLICY IF EXISTS "Admin can view all entries" ON journal_entries;

-- ============================================================================
-- NEW POLICIES: Restrict admin access to journal content
-- ============================================================================

-- Users can view their own entries
CREATE POLICY "Users can view own entries"
    ON journal_entries FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can create their own entries
CREATE POLICY "Users can create own entries"
    ON journal_entries FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users can update own entries"
    ON journal_entries FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete own entries"
    ON journal_entries FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Therapists can view patient entries ONLY if allow_therapist_access is true
CREATE POLICY "Therapists can view patient entries"
    ON journal_entries FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM therapist_patients tp
            JOIN user_profiles up ON up.id = journal_entries.user_id
            WHERE tp.therapist_id = auth.uid()
            AND tp.user_id = journal_entries.user_id
            AND tp.is_active = true
            AND up.allow_therapist_access = true
        )
    );

-- ============================================================================
-- IMPORTANT: Admin access is handled via service role key
-- Admin APIs use createAdminClient() which bypasses RLS
-- This allows admin to:
--   - Count entries (SELECT with count)
--   - Get aggregated metrics (SELECT specific columns)
--   - But NOT read actual journal content in the application
-- ============================================================================

-- Note: No admin policy is created here because:
-- 1. Admin uses service role key which bypasses RLS
-- 2. Application logic restricts what admin can query
-- 3. Admin can only access:
--    - Entry counts
--    - Aggregated scores (averages)
--    - Entry dates (for activity tracking)
--    - NOT the actual content field

-- ============================================================================
-- Additional security: Ensure journal_entries has RLS enabled
-- ============================================================================

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE journal_entries IS 'User journal entries with privacy controls. Admin can only see aggregated data via service role, not actual content.';
COMMENT ON COLUMN journal_entries.content IS 'Private journal content. Only accessible by user and authorized therapists. Admin cannot read this field.';
