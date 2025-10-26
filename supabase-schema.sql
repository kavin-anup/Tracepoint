-- Create projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bugs table
CREATE TABLE bugs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bug_id TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  name TEXT NOT NULL,
  description TEXT,
  developer_notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_bugs_project_id ON bugs(project_id);
CREATE INDEX idx_bugs_priority ON bugs(priority);
CREATE INDEX idx_bugs_status ON bugs(status);
CREATE INDEX idx_bugs_created_at ON bugs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_bugs_updated_at
  BEFORE UPDATE ON bugs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you may want to restrict this based on your needs)
CREATE POLICY "Enable read access for all users" ON projects FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON projects FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON projects FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON bugs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON bugs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON bugs FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON bugs FOR DELETE USING (true);

