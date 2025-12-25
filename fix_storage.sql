-- Run this in your Supabase SQL Editor to fix the "violates row-level security" error.

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project_previews', 'project_previews', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop potential conflicting policies
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- 3. Create permissive policies for the preview bucket
-- Allow anyone (checking out your public link) to VIEW the image
-- Allow anyone (checking out your public link) to VIEW the image
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'project_previews' );

-- Allow the application (anon or auth) to UPLOAD the preview
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'project_previews' );

-- Allow updating (for autosave)
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
TO public
USING ( bucket_id = 'project_previews' );

-- Allow deleting (for cleanup)
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
TO public
USING ( bucket_id = 'project_previews' );
