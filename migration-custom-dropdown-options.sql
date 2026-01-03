-- Create table for storing custom dropdown options per project
CREATE TABLE IF NOT EXISTS project_custom_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  option_type TEXT NOT NULL CHECK (option_type IN ('portal', 'priority', 'status', 'assigned_to')),
  option_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, option_type, option_value)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_custom_options_project_id ON project_custom_options(project_id);
CREATE INDEX IF NOT EXISTS idx_project_custom_options_type ON project_custom_options(project_id, option_type);

-- Enable Row Level Security (RLS)
ALTER TABLE project_custom_options ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable read access for all users" ON project_custom_options FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON project_custom_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON project_custom_options FOR DELETE USING (true);

