-- Migration: Project-Specific Bug IDs
-- This script updates the bug_id system to be project-specific
-- Each project will have its own bug counter starting from 0

-- Step 1: Drop existing bug_id_counter table and related objects
DO $$ 
BEGIN
  -- Drop existing trigger
  DROP TRIGGER IF EXISTS set_bug_id ON bugs;
  
  -- Drop existing function
  DROP FUNCTION IF EXISTS generate_bug_id();
  
  -- Drop old counter table
  DROP TABLE IF EXISTS bug_id_counter;
  
  EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Step 2: Create new project-specific bug counter table
CREATE TABLE IF NOT EXISTS project_bug_counter (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  counter INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create function to generate project-specific bug IDs
CREATE OR REPLACE FUNCTION generate_project_bug_id()
RETURNS TRIGGER AS $$
DECLARE
  new_counter INTEGER;
BEGIN
  -- Initialize counter for new projects
  INSERT INTO project_bug_counter (project_id, counter)
  VALUES (NEW.project_id, 0)
  ON CONFLICT (project_id) DO NOTHING;
  
  -- Get and increment counter for this project
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

-- Step 4: Create trigger to auto-generate bug_id on insert
CREATE TRIGGER set_project_bug_id
BEFORE INSERT ON bugs
FOR EACH ROW
EXECUTE FUNCTION generate_project_bug_id();

-- Step 5: Reset existing bug IDs to be project-specific (optional, uncomment if needed)
-- WARNING: This will reset all existing bug IDs!
-- DO $$ 
-- DECLARE
--   project_record RECORD;
--   bug_record RECORD;
--   bug_counter INTEGER;
-- BEGIN
--   -- Loop through each project
--   FOR project_record IN SELECT id FROM projects LOOP
--     bug_counter := 0;
--     
--     -- Loop through bugs for this project (ordered by creation date)
--     FOR bug_record IN 
--       SELECT id FROM bugs 
--       WHERE project_id = project_record.id 
--       ORDER BY created_at ASC
--     LOOP
--       -- Update bug_id to project-specific format
--       UPDATE bugs 
--       SET bug_id = 'TP-' || bug_counter 
--       WHERE id = bug_record.id;
--       
--       bug_counter := bug_counter + 1;
--     END LOOP;
--     
--     -- Update project counter
--     INSERT INTO project_bug_counter (project_id, counter)
--     VALUES (project_record.id, bug_counter)
--     ON CONFLICT (project_id) 
--     DO UPDATE SET counter = bug_counter;
--   END LOOP;
-- END $$;

-- Step 6: Add RLS policies for project_bug_counter
ALTER TABLE project_bug_counter ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view project bug counters" ON project_bug_counter;
  DROP POLICY IF EXISTS "System can insert project bug counters" ON project_bug_counter;
  DROP POLICY IF EXISTS "System can update project bug counters" ON project_bug_counter;
  EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Allow anyone to read counters
CREATE POLICY "Anyone can view project bug counters"
  ON project_bug_counter
  FOR SELECT
  TO public
  USING (true);

-- Allow inserts (handled by trigger)
CREATE POLICY "System can insert project bug counters"
  ON project_bug_counter
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow updates (handled by trigger)
CREATE POLICY "System can update project bug counters"
  ON project_bug_counter
  FOR UPDATE
  TO public
  USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Bug IDs are now project-specific.';
  RAISE NOTICE 'Each project will have its own counter starting from TP-0.';
END $$;

