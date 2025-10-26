-- Fix: Remove global unique constraint on bug_id
-- Bug IDs should be unique per project, not globally
-- This allows multiple projects to have TP-0, TP-1, etc.

-- Step 1: Drop the unique constraint on bug_id
ALTER TABLE bugs DROP CONSTRAINT IF EXISTS bugs_bug_id_key;

-- Step 2: Create a composite unique constraint (project_id + bug_id)
-- This ensures bug_id is unique within each project, but can repeat across projects
ALTER TABLE bugs ADD CONSTRAINT bugs_project_bug_id_unique 
  UNIQUE (project_id, bug_id);

-- Step 3: Verify the constraint was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bugs_project_bug_id_unique'
  ) THEN
    RAISE NOTICE '✓ Composite unique constraint created successfully';
    RAISE NOTICE '✓ Bug IDs are now unique per project (not globally)';
    RAISE NOTICE '✓ Multiple projects can now have TP-0, TP-1, etc.';
  ELSE
    RAISE EXCEPTION '✗ Failed to create composite unique constraint';
  END IF;
END $$;


