-- =========================================================================
-- SECURE STORAGE MIGRATION
-- Run this script in the Supabase SQL Editor
-- =========================================================================

-- 1. Make the patient-files bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'patient-files';

-- 2. Drop the public SELECT policy
DROP POLICY IF EXISTS "Allow public to view files" ON storage.objects;

-- 3. Create an authenticated SELECT policy
CREATE POLICY "Allow authenticated to view files"
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'patient-files');

-- 4. Ensure INSERT policy is still restricted to authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-files');

-- 5. Ensure DELETE policy is still restricted to authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'patient-files');

-- Force reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
