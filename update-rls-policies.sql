-- ============================================
-- SECURITY UPDATE: Restrict RLS Policies
-- ============================================
-- This script updates Row Level Security policies to require authentication
-- IMPORTANT: Run this in Supabase SQL Editor after setting up Supabase Auth
-- ============================================

-- Step 1: Drop existing public access policies
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Enable insert access for all users" ON projects;
DROP POLICY IF EXISTS "Enable update access for all users" ON projects;
DROP POLICY IF EXISTS "Enable delete access for all users" ON projects;

DROP POLICY IF EXISTS "Enable read access for all users" ON bugs;
DROP POLICY IF EXISTS "Enable insert access for all users" ON bugs;
DROP POLICY IF EXISTS "Enable update access for all users" ON bugs;
DROP POLICY IF EXISTS "Enable delete access for all users" ON bugs;

DROP POLICY IF EXISTS "Enable read access for all users" ON bug_id_counter;
DROP POLICY IF EXISTS "Enable update access for all users" ON bug_id_counter;

-- Step 2: Create new authenticated-only policies for PROJECTS table
-- Only authenticated users can read projects
CREATE POLICY "Authenticated users can read projects"
  ON projects FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated users can insert projects
CREATE POLICY "Authenticated users can insert projects"
  ON projects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update projects
CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can delete projects
CREATE POLICY "Authenticated users can delete projects"
  ON projects FOR DELETE
  USING (auth.role() = 'authenticated');

-- Step 3: Create new authenticated-only policies for BUGS table
-- Only authenticated users can read bugs
CREATE POLICY "Authenticated users can read bugs"
  ON bugs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated users can insert bugs
CREATE POLICY "Authenticated users can insert bugs"
  ON bugs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update bugs
CREATE POLICY "Authenticated users can update bugs"
  ON bugs FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can delete bugs
CREATE POLICY "Authenticated users can delete bugs"
  ON bugs FOR DELETE
  USING (auth.role() = 'authenticated');

-- Step 4: Create new authenticated-only policies for BUG_ID_COUNTER table
-- Only authenticated users can read bug_id_counter
CREATE POLICY "Authenticated users can read bug_id_counter"
  ON bug_id_counter FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated users can update bug_id_counter
CREATE POLICY "Authenticated users can update bug_id_counter"
  ON bug_id_counter FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify policies are set correctly:

-- Check projects policies
-- SELECT * FROM pg_policies WHERE tablename = 'projects';

-- Check bugs policies
-- SELECT * FROM pg_policies WHERE tablename = 'bugs';

-- Check bug_id_counter policies
-- SELECT * FROM pg_policies WHERE tablename = 'bug_id_counter';

-- ============================================
-- NOTES
-- ============================================
-- 1. These policies require users to be authenticated via Supabase Auth
-- 2. Currently, all authenticated users have full access to all data
-- 3. For better security, consider implementing:
--    - User-project relationships (project_users table)
--    - Role-based access control (admin, developer, viewer)
--    - Project-specific access restrictions
--
-- NEXT STEPS (Future improvements):
-- 1. Create project_users table to link users to projects
-- 2. Update policies to check project ownership/membership
-- 3. Add role-based restrictions (e.g., only admins can delete)
-- 4. Implement audit logging
-- ============================================

