-- Drop existing tables if you want to start fresh (CAUTION: This deletes all data!)
-- DROP TABLE IF EXISTS bugs CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;

-- Create projects table with project details field
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bugs table with all new fields
CREATE TABLE IF NOT EXISTS bugs (
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

-- Create a sequence counter table for bug IDs
CREATE TABLE IF NOT EXISTS bug_id_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  counter INTEGER NOT NULL DEFAULT 0
);

-- Initialize the counter if it doesn't exist
INSERT INTO bug_id_counter (id, counter) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- Function to generate sequential bug IDs
CREATE OR REPLACE FUNCTION generate_bug_id()
RETURNS TEXT AS $$
DECLARE
  new_counter INTEGER;
  new_bug_id TEXT;
BEGIN
  -- Increment and get the new counter value
  UPDATE bug_id_counter SET counter = counter + 1 WHERE id = 1 RETURNING counter INTO new_counter;
  
  -- Generate bug ID in format TP-1, TP-2, etc.
  new_bug_id := 'TP-' || new_counter;
  
  RETURN new_bug_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate bug ID before insert
CREATE OR REPLACE FUNCTION set_bug_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bug_id IS NULL OR NEW.bug_id = '' THEN
    NEW.bug_id := generate_bug_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_bug_id ON bugs;
CREATE TRIGGER auto_generate_bug_id
  BEFORE INSERT ON bugs
  FOR EACH ROW
  EXECUTE FUNCTION set_bug_id();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bugs_project_id ON bugs(project_id);
CREATE INDEX IF NOT EXISTS idx_bugs_priority ON bugs(priority);
CREATE INDEX IF NOT EXISTS idx_bugs_status ON bugs(status);
CREATE INDEX IF NOT EXISTS idx_bugs_date_added ON bugs(date_added);
CREATE INDEX IF NOT EXISTS idx_bugs_bug_id ON bugs(bug_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at for bugs
DROP TRIGGER IF EXISTS update_bugs_updated_at ON bugs;
CREATE TRIGGER update_bugs_updated_at
  BEFORE UPDATE ON bugs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_id_counter ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
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

-- Create policies for public access
CREATE POLICY "Enable read access for all users" ON projects FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON projects FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON projects FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON bugs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON bugs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON bugs FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON bugs FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON bug_id_counter FOR SELECT USING (true);
CREATE POLICY "Enable update access for all users" ON bug_id_counter FOR UPDATE USING (true);

