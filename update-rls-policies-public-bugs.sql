-- ============================================
-- RLS POLICIES: Public Bug Access + Authenticated Project Management
-- ============================================
-- This allows:
-- - Authenticated users: Full access (create/edit/delete projects and bugs)
-- - Unauthenticated users: Can view projects, create/edit bugs (but not delete bugs or manage projects)
-- ============================================

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Enable insert access for all users" ON projects;
DROP POLICY IF EXISTS "Enable update access for all users" ON projects;
DROP POLICY IF EXISTS "Enable delete access for all users" ON projects;

DROP POLICY IF EXISTS "Enable read access for all users" ON bugs;
DROP POLICY IF EXISTS "Enable insert access for all users" ON bugs;
DROP POLICY IF EXISTS "Enable update access for all users" ON bugs;
DROP POLICY IF EXISTS "Enable delete access for all users" ON bugs;

DROP POLICY IF EXISTS "Authenticated users can read projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON projects;

DROP POLICY IF EXISTS "Authenticated users can read bugs" ON bugs;
DROP POLICY IF EXISTS "Authenticated users can insert bugs" ON bugs;
DROP POLICY IF EXISTS "Authenticated users can update bugs" ON bugs;
DROP POLICY IF EXISTS "Authenticated users can delete bugs" ON bugs;

DROP POLICY IF EXISTS "Enable read access for all users" ON project_bug_counter;
DROP POLICY IF EXISTS "Enable update access for all users" ON project_bug_counter;
DROP POLICY IF EXISTS "Authenticated users can read bug_id_counter" ON project_bug_counter;
DROP POLICY IF EXISTS "Authenticated users can update bug_id_counter" ON project_bug_counter;
DROP POLICY IF EXISTS "System can insert project bug counters" ON project_bug_counter;
DROP POLICY IF EXISTS "Anyone can view project bug counters" ON project_bug_counter;
DROP POLICY IF EXISTS "System can update project bug counters" ON project_bug_counter;

-- ============================================
-- PROJECTS TABLE POLICIES
-- ============================================
-- Projects: Only authenticated users can manage projects
-- But anyone can read projects (needed for public project links)

-- Anyone can read projects (for public project links)
CREATE POLICY "Public can read projects"
  ON projects FOR SELECT
  USING (true);

-- Only authenticated users can create projects
CREATE POLICY "Authenticated users can create projects"
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

-- ============================================
-- BUGS TABLE POLICIES
-- ============================================
-- Bugs: Public can read, create, and update bugs
-- But only authenticated users can delete bugs

-- Anyone can read bugs (for public project links)
CREATE POLICY "Public can read bugs"
  ON bugs FOR SELECT
  USING (true);

-- Anyone can create bugs (for public project links)
CREATE POLICY "Public can create bugs"
  ON bugs FOR INSERT
  WITH CHECK (true);

-- Anyone can update bugs (for public project links - allows editing and reopening)
CREATE POLICY "Public can update bugs"
  ON bugs FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete bugs (admin control)
CREATE POLICY "Authenticated users can delete bugs"
  ON bugs FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- PROJECT_BUG_COUNTER TABLE POLICIES
-- ============================================
-- Project Bug Counter: Anyone can read/update/insert (needed for bug creation)

-- Anyone can read project_bug_counter (needed for bug creation)
CREATE POLICY "Public can read project_bug_counter"
  ON project_bug_counter FOR SELECT
  USING (true);

-- Anyone can insert project_bug_counter (needed for new projects)
CREATE POLICY "Public can insert project_bug_counter"
  ON project_bug_counter FOR INSERT
  WITH CHECK (true);

-- Anyone can update project_bug_counter (needed for bug creation)
CREATE POLICY "Public can update project_bug_counter"
  ON project_bug_counter FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify policies are set correctly:

-- Check projects policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE tablename = 'projects' ORDER BY policyname;

-- Check bugs policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE tablename = 'bugs' ORDER BY policyname;

-- Check project_bug_counter policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE tablename = 'project_bug_counter' ORDER BY policyname;

-- ============================================
-- NOTES
-- ============================================
-- 1. Public (unauthenticated) users can:
--    - View projects and bugs
--    - Create bugs
--    - Edit bugs (including reopening closed bugs)
--    - Cannot delete bugs
--    - Cannot create/edit/delete projects
--
-- 2. Authenticated users can:
--    - Everything public users can do
--    - Create/edit/delete projects
--    - Delete bugs
--
-- 3. Security considerations:
--    - Project links are effectively public - anyone with the link can access
--    - Consider adding project-specific access tokens in the future
--    - Consider adding rate limiting for unauthenticated users
--    - Consider adding CAPTCHA for bug creation by unauthenticated users
--
-- 4. To make a project truly private:
--    - Add a "public_access" boolean column to projects table
--    - Update policies to check this column
--    - Only allow public access if public_access = true
-- ============================================

