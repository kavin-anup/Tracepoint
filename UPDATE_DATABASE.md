# Database Update Guide

## ⚠️ IMPORTANT: You MUST Update Your Database Schema

The bug tracker has been significantly upgraded with new features. You need to run the new SQL schema to update your database.

## New Features Added:

1. **Auto-Generated Sequential Bug IDs** - Format: TP-1, TP-2, TP-3, etc.
2. **Project Details Rich Text Field** - Large editable text area for project context
3. **New Bug Table Columns:**
   - Portal (Dropdown: Admin Panel, Customer Side)
   - Priority (Dropdown: Minor, Medium, Major, Critical)
   - Module/Feature (Text Input)
   - Bug Description (Text Input)
   - Status (Dropdown: Open, In Progress, Ready for QA, Closed, Reopened, Not a Bug, Needs Clarification)
   - Assigned To (Dropdown: Developer, Frontend, Backend)
   - Bug Link (URL/Text Input)
   - Client Notes (Rich Text)
   - Developer Notes (Text)
   - Date Added (Auto-Generated)

4. **Projects Open in New Windows** - Each project opens in a separate tab/window

## How to Update Your Database:

### Option 1: Clean Install (Recommended if you have no data)
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema-v2.sql`
4. Click "Run"
5. Restart your development server

### Option 2: Preserve Existing Data (If you have projects/bugs already)

**WARNING:** This will modify your existing tables. Back up your data first!

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. **BACKUP YOUR DATA FIRST:**
   ```sql
   -- Export your existing data
   SELECT * FROM projects;
   SELECT * FROM bugs;
   ```
4. Run this migration script to preserve your data:

```sql
-- Add new columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_details TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create backup of bugs table
CREATE TABLE bugs_backup AS SELECT * FROM bugs;

-- Drop old bugs table
DROP TABLE IF EXISTS bugs CASCADE;

-- Create new bugs table with all fields
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

-- Create bug ID counter table
CREATE TABLE IF NOT EXISTS bug_id_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  counter INTEGER NOT NULL DEFAULT 0
);
INSERT INTO bug_id_counter (id, counter) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- Create function to generate bug IDs
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

-- Create trigger for auto bug ID
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

-- Migrate old data to new structure (adjust column mappings as needed)
INSERT INTO bugs (
  id, 
  project_id, 
  bug_id, 
  portal, 
  priority, 
  module_feature, 
  bug_description, 
  status, 
  assigned_to, 
  developer_notes,
  created_at,
  date_added
)
SELECT 
  id,
  project_id,
  bug_id,
  'Admin Panel' as portal,
  CASE 
    WHEN priority = 'critical' THEN 'Critical'
    WHEN priority = 'high' THEN 'Major'
    WHEN priority = 'medium' THEN 'Medium'
    WHEN priority = 'low' THEN 'Minor'
    ELSE 'Medium'
  END as priority,
  name as module_feature,
  description as bug_description,
  CASE 
    WHEN status = 'open' THEN 'Open'
    WHEN status = 'in_progress' THEN 'In Progress'
    WHEN status = 'resolved' THEN 'Closed'
    WHEN status = 'closed' THEN 'Closed'
    ELSE 'Open'
  END as status,
  'Developer' as assigned_to,
  developer_notes,
  created_at,
  created_at as date_added
FROM bugs_backup;

-- Drop backup table
DROP TABLE bugs_backup;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bugs_project_id ON bugs(project_id);
CREATE INDEX IF NOT EXISTS idx_bugs_priority ON bugs(priority);
CREATE INDEX IF NOT EXISTS idx_bugs_status ON bugs(status);
CREATE INDEX IF NOT EXISTS idx_bugs_date_added ON bugs(date_added);
CREATE INDEX IF NOT EXISTS idx_bugs_bug_id ON bugs(bug_id);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_id_counter ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Enable insert access for all users" ON projects;
DROP POLICY IF EXISTS "Enable update access for all users" ON projects;
DROP POLICY IF EXISTS "Enable delete access for all users" ON projects;

CREATE POLICY "Enable read access for all users" ON projects FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON projects FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON projects FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON bugs;
DROP POLICY IF EXISTS "Enable insert access for all users" ON bugs;
DROP POLICY IF EXISTS "Enable update access for all users" ON bugs;
DROP POLICY IF EXISTS "Enable delete access for all users" ON bugs;

CREATE POLICY "Enable read access for all users" ON bugs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON bugs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON bugs FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON bugs FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON bug_id_counter;
DROP POLICY IF EXISTS "Enable update access for all users" ON bug_id_counter;

CREATE POLICY "Enable read access for all users" ON bug_id_counter FOR SELECT USING (true);
CREATE POLICY "Enable update access for all users" ON bug_id_counter FOR UPDATE USING (true);
```

5. Restart your development server

## After Updating:

1. **Restart the development server** (the server needs to reload the new code)
2. **Test creating a new project** - Should open in a new window/tab
3. **Test adding a bug** - Bug ID should auto-generate as TP-1, TP-2, etc.
4. **Test the Project Details section** - Should have an editable rich text area
5. **Verify all new fields** are working in the bug form

## Troubleshooting:

- If you get errors about missing columns, run the schema again
- If bug IDs don't auto-generate, check that the trigger was created
- If projects don't open in new windows, clear your browser cache and restart the dev server

## Need Help?

If you encounter any issues, you can always:
1. Drop all tables and run `supabase-schema-v2.sql` for a fresh start
2. Check the browser console for error messages
3. Check the Supabase logs for database errors

