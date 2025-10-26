-- Complete Fix for Bug ID Function Issue
-- This script completely removes all old bug_id related objects and creates new ones

-- Step 1: Drop only our custom triggers (not system/constraint triggers)
DROP TRIGGER IF EXISTS set_bug_id ON bugs;
DROP TRIGGER IF EXISTS set_project_bug_id ON bugs;
DROP TRIGGER IF EXISTS auto_generate_bug_id ON bugs;
DROP TRIGGER IF EXISTS update_bugs_updated_at ON bugs;

-- Step 2: Drop ALL functions related to bug_id (with all possible signatures)
DROP FUNCTION IF EXISTS generate_bug_id() CASCADE;
DROP FUNCTION IF EXISTS generate_project_bug_id() CASCADE;
DROP FUNCTION IF EXISTS set_bug_id() CASCADE;
DROP FUNCTION IF EXISTS update_bugs_updated_at() CASCADE;

-- Step 3: Drop old counter tables
DROP TABLE IF EXISTS bug_id_counter CASCADE;
DROP TABLE IF EXISTS project_bug_counter CASCADE;

-- Step 4: Create new project-specific bug counter table
CREATE TABLE project_bug_counter (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  counter INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create NEW function to generate project-specific bug IDs
CREATE OR REPLACE FUNCTION generate_project_bug_id()
RETURNS TRIGGER AS $$
DECLARE
  new_counter INTEGER;
BEGIN
  -- Initialize counter for new projects if it doesn't exist
  INSERT INTO project_bug_counter (project_id, counter)
  VALUES (NEW.project_id, 0)
  ON CONFLICT (project_id) DO NOTHING;
  
  -- Get and increment counter for this specific project
  UPDATE project_bug_counter
  SET counter = counter + 1,
      updated_at = NOW()
  WHERE project_id = NEW.project_id
  RETURNING counter INTO new_counter;
  
  -- Set the bug_id in format TP-0, TP-1, TP-2, etc.
  NEW.bug_id := 'TP-' || new_counter;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create NEW trigger to auto-generate bug_id on insert
CREATE TRIGGER set_project_bug_id
BEFORE INSERT ON bugs
FOR EACH ROW
EXECUTE FUNCTION generate_project_bug_id();

-- Step 7: Recreate update_updated_at trigger for bugs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bugs_updated_at
BEFORE UPDATE ON bugs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Enable RLS on project_bug_counter
ALTER TABLE project_bug_counter ENABLE ROW LEVEL SECURITY;

-- Step 9: Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view project bug counters" ON project_bug_counter;
DROP POLICY IF EXISTS "System can insert project bug counters" ON project_bug_counter;
DROP POLICY IF EXISTS "System can update project bug counters" ON project_bug_counter;

-- Step 10: Create RLS policies for project_bug_counter
CREATE POLICY "Anyone can view project bug counters"
  ON project_bug_counter
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "System can insert project bug counters"
  ON project_bug_counter
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "System can update project bug counters"
  ON project_bug_counter
  FOR UPDATE
  TO public
  USING (true);

-- Step 11: Verify everything is set up correctly
DO $$
BEGIN
  -- Check if function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_project_bug_id') THEN
    RAISE NOTICE '✓ Function generate_project_bug_id() created successfully';
  ELSE
    RAISE EXCEPTION '✗ Function generate_project_bug_id() was not created';
  END IF;
  
  -- Check if trigger exists
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_project_bug_id') THEN
    RAISE NOTICE '✓ Trigger set_project_bug_id created successfully';
  ELSE
    RAISE EXCEPTION '✗ Trigger set_project_bug_id was not created';
  END IF;
  
  -- Check if table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'project_bug_counter') THEN
    RAISE NOTICE '✓ Table project_bug_counter created successfully';
  ELSE
    RAISE EXCEPTION '✗ Table project_bug_counter was not created';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Bug IDs are now project-specific.';
  RAISE NOTICE 'Each project will have its own counter starting from TP-0.';
  RAISE NOTICE '==============================================';
END $$;

