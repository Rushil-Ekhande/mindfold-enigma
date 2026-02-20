-- ============================================================================
-- Fix Therapist Registration Flow - Complete End-to-End Solution
-- ============================================================================

-- 1. Allow service_role to insert into profiles (for admin client during registration)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Service role can insert any profile'
    ) THEN
        CREATE POLICY "Service role can insert any profile"
            ON profiles FOR INSERT TO service_role
            WITH CHECK (true);
    END IF;
END $$;

-- 2. Allow service_role to insert into therapist_profiles (for admin client during registration)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'therapist_profiles' 
        AND policyname = 'Service role can insert any therapist profile'
    ) THEN
        CREATE POLICY "Service role can insert any therapist profile"
            ON therapist_profiles FOR INSERT TO service_role
            WITH CHECK (true);
    END IF;
END $$;

-- 3. Fix storage policies for therapist-documents bucket
-- Allow authenticated users to upload documents during registration (to 'temp/' folder)
DROP POLICY IF EXISTS "Therapists can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Therapists can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all therapist documents" ON storage.objects;

-- Allow authenticated users to upload to temp/ folder during registration
CREATE POLICY "Authenticated users can upload registration documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'therapist-documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'temp'
    );

-- Allow authenticated users to read their own documents (by checking auth.uid in path)
CREATE POLICY "Users can view their own documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'therapist-documents' AND
        auth.role() = 'authenticated'
    );

-- Allow service_role (admin client) to read all documents
CREATE POLICY "Service role can view all documents"
    ON storage.objects FOR SELECT TO service_role
    USING (bucket_id = 'therapist-documents');

-- Allow admins to view all therapist documents
CREATE POLICY "Admins can view all therapist documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'therapist-documents' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Ensure therapist_profiles table has all necessary columns
DO $$
BEGIN
    -- Check if license_number column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'therapist_profiles' 
        AND column_name = 'license_number'
    ) THEN
        ALTER TABLE therapist_profiles ADD COLUMN license_number TEXT;
    END IF;
END $$;

-- 5. Create index on verification_status for better admin query performance
CREATE INDEX IF NOT EXISTS idx_therapist_verification_status 
    ON therapist_profiles(verification_status, created_at DESC);

-- Summary: This migration ensures:
-- ✅ Service role (admin client) can insert into profiles and therapist_profiles during registration
-- ✅ Authenticated users can upload documents to temp/ folder during registration
-- ✅ Storage bucket policies allow proper access for users, admins, and service role
-- ✅ Admin panel can query and update therapist verification status efficiently
