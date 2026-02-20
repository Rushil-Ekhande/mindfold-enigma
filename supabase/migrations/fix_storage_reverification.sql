-- ============================================================================
-- Migration: Fix Storage RLS Policies for Therapist Re-verification
-- ============================================================================
-- This migration adds policies to allow therapists to upload and delete
-- documents in their own folder during re-verification process.
--
-- IMPORTANT: Run this in Supabase Dashboard SQL Editor (not via CLI)
-- The dashboard has the necessary permissions to modify storage policies.
-- ============================================================================

-- First, check if the policies exist and drop them
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Therapists can upload to own folder" ON storage.objects;
    DROP POLICY IF EXISTS "Therapists can delete own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Therapists can update own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Service role full access" ON storage.objects;
    
    -- Also drop the old policy from previous migration if it exists
    DROP POLICY IF EXISTS "Authenticated users can upload registration documents" ON storage.objects;
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Some policies could not be dropped due to permissions. This is OK if they do not exist.';
END $$;

-- Allow therapists to upload documents to their own folder (user_id/*)
-- This is needed for re-verification when they need to replace documents
CREATE POLICY "Therapists can upload to own folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'therapist-documents' AND
        (
            -- Allow upload to temp/ folder during registration
            (storage.foldername(name))[1] = 'temp'
            OR
            -- Allow upload to own folder (user_id/*) for re-verification
            auth.uid()::text = (storage.foldername(name))[1]
        )
    );

-- Allow therapists to delete their own documents
-- This is needed when replacing old documents during re-verification
CREATE POLICY "Therapists can delete own documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'therapist-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow therapists to update their own documents (optional, for future use)
CREATE POLICY "Therapists can update own documents"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'therapist-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'therapist-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Note: Service role bypasses RLS by default, so no explicit policy needed
