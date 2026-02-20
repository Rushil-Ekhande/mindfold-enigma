-- Migration: Add mood column to journal_entries
ALTER TABLE journal_entries ADD COLUMN mood TEXT;
-- Optionally, add a comment for clarity
COMMENT ON COLUMN journal_entries.mood IS 'AI-generated mood status (e.g. Happy, Sad, Calm, Anxious, etc.)';
