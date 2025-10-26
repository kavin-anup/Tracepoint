-- Migration Script to Update Bug Tracker Database
-- This script safely updates your existing database to the new schema

-- Step 1: Drop old triggers and functions
DROP TRIGGER IF EXISTS auto_generate_bug_id ON bugs;
DROP TRIGGER IF EXISTS update_bugs_updated_at ON bugs;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP FUNCTION IF EXISTS set_bug_id();
DROP FUNCTION IF EXISTS generate_bug_id();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Step 2: Drop old indexes
DROP INDEX IF EXISTS idx_bugs_project_id;
DROP INDEX IF EXISTS idx_bugs_priority;
DROP INDEX IF EXISTS idx_bugs_status;
DROP INDEX IF EXISTS idx_bugs_created_at;
DROP INDEX IF EXISTS idx_bugs_date_added;
DROP INDEX IF EXISTS idx_bugs_bug_id;

-- Step 3: Drop old policies (only if tables exist)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
  DROP POLICY IF EXISTS "Enable insert access for all users" ON projects;
  DROP POLICY IF EXISTS "Enable update access for all users" ON projects;
  DROP POLICY IF EXISTS "Enable delete access for all users" ON projects;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON bugs;
  DROP POLICY IF EXISTS "Enable insert access for all users" ON bugs;
  DROP POLICY IF EXISTS "Enable update access for all users" ON bugs;
  DROP POLICY IF EXISTS "Enable delete access for all users" ON bugs;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON bug_id_counter;
  DROP POLICY IF EXISTS "Enable update access for all users" ON bug_id_counter;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Step 4: Drop old tables completely (CAUTION: This will delete all your data!)
DROP TABLE IF EXISTS bugs CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS bug_id_counter CASCADE;

-- Step 5: Create projects table with new schema
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create bugs table with new schema
CREATE TABLE bugs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bug_id TEXT NOT NULL UNIQUE,
  portal TEXT NOT NULL DEFAULT 'Admin Panel',
  priority TEXT NOT NULL DEFAULT 'Medium',
  module_feature TEXT,
  bug_description TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  assigned_to TEXT NOT NULL DEFAULT 'Developer',
  bug_link TEXT,
  client_notes TEXT,
  developer_notes TEXT,
  date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create bug ID counter table
CREATE TABLE bug_id_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  counter INTEGER NOT NULL DEFAULT 0
);

-- Initialize the counter
INSERT INTO bug_id_counter (id, counter) VALUES (1, 0);

-- Step 8: Create function to generate bug IDs
CREATE OR REPLACE FUNCTION generate_bug_id()
RETURNS TEXT AS $$
DECLARE
  new_counter INTEGER;
  new_bug_id TEXT;
BEGIN
  UPDATE bug_id_counter SET counter = counter + 1 WHERE id = 1 RETURNING counter INTO new_counter;
  new_bug_id := 'TP-' || new_counter;
  RETURN new_bug_id;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger function for bug ID
CREATE OR REPLACE FUNCTION set_bug_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bug_id IS NULL OR NEW.bug_id = '' THEN
    NEW.bug_id := generate_bug_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create trigger to auto-generate bug IDs
CREATE TRIGGER auto_generate_bug_id
  BEFORE INSERT ON bugs
  FOR EACH ROW
  EXECUTE FUNCTION set_bug_id();

-- Step 11: Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bugs_updated_at
  BEFORE UPDATE ON bugs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 13: Create indexes for performance
CREATE INDEX idx_bugs_project_id ON bugs(project_id);
CREATE INDEX idx_bugs_priority ON bugs(priority);
CREATE INDEX idx_bugs_status ON bugs(status);
CREATE INDEX idx_bugs_date_added ON bugs(date_added);
CREATE INDEX idx_bugs_bug_id ON bugs(bug_id);

-- Step 14: Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_id_counter ENABLE ROW LEVEL SECURITY;

-- Step 15: Create RLS policies for projects
CREATE POLICY "Enable read access for all users" ON projects FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON projects FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON projects FOR DELETE USING (true);

-- Step 16: Create RLS policies for bugs
CREATE POLICY "Enable read access for all users" ON bugs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON bugs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON bugs FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON bugs FOR DELETE USING (true);

-- Step 17: Create RLS policies for bug_id_counter
CREATE POLICY "Enable read access for all users" ON bug_id_counter FOR SELECT USING (true);
CREATE POLICY "Enable update access for all users" ON bug_id_counter FOR UPDATE USING (true);

-- Migration complete!
-- Your database is now updated with all new fields and features.
