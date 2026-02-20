-- Add Mood column to Journal Entries table (if it doesn't already exist)
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS mood TEXT;

-- Comment for reference
COMMENT ON COLUMN public.journal_entries.mood IS 'AI-generated single-word mood based on the journal entry content (e.g. Happy, Anxious, Calm, etc.)';
