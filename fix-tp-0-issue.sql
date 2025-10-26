-- Fix: Make TP-0 actually be TP-0 (not TP-1)
-- The issue: counter starts at 0, but we increment BEFORE assigning, so we get TP-1
-- The fix: Use the counter value BEFORE incrementing for the bug_id

-- Drop the existing function and trigger
DROP TRIGGER IF EXISTS auto_generate_bug_id ON bugs;
DROP FUNCTION IF EXISTS generate_project_bug_id() CASCADE;

-- Create the FIXED function that assigns CURRENT counter value, then increments
CREATE OR REPLACE FUNCTION generate_project_bug_id()
RETURNS TRIGGER AS $$
DECLARE
  current_counter INTEGER;
BEGIN
  -- Initialize counter for new projects (starts at 0)
  INSERT INTO project_bug_counter (project_id, counter)
  VALUES (NEW.project_id, 0)
  ON CONFLICT (project_id) DO NOTHING;

  -- Get CURRENT counter value (before incrementing)
  SELECT counter INTO current_counter
  FROM project_bug_counter
  WHERE project_id = NEW.project_id;

  -- Set the bug_id using CURRENT counter (so first bug is TP-0)
  NEW.bug_id := 'TP-' || current_counter;

  -- NOW increment the counter for next time
  UPDATE project_bug_counter
  SET counter = counter + 1,
      updated_at = NOW()
  WHERE project_id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER auto_generate_bug_id
BEFORE INSERT ON bugs
FOR EACH ROW
EXECUTE FUNCTION generate_project_bug_id();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Bug ID function fixed!';
  RAISE NOTICE '✓ First bug will now be TP-0 (not TP-1)';
  RAISE NOTICE '✓ Counter logic: Use current value, then increment';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run the reset-project-counters.sql script';
  RAISE NOTICE '2. Create a new project';
  RAISE NOTICE '3. First bug should be TP-0! 🎉';
END $$;

