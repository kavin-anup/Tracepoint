-- Reset all project bug counters to match their actual bug counts
-- This fixes the issue where counters were incremented but bugs weren't created

-- Step 1: Reset all project counters based on actual bug count
DO $$
DECLARE
  project_record RECORD;
  actual_bug_count INTEGER;
BEGIN
  -- Loop through all projects
  FOR project_record IN SELECT id FROM projects LOOP
    
    -- Count actual bugs for this project
    SELECT COUNT(*) INTO actual_bug_count
    FROM bugs
    WHERE project_id = project_record.id;
    
    -- Update or insert the correct counter
    INSERT INTO project_bug_counter (project_id, counter)
    VALUES (project_record.id, actual_bug_count)
    ON CONFLICT (project_id) 
    DO UPDATE SET 
      counter = actual_bug_count,
      updated_at = NOW();
    
    RAISE NOTICE 'Project % counter reset to %', project_record.id, actual_bug_count;
    
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✓ All project counters have been reset';
  RAISE NOTICE '✓ Counters now match actual bug counts';
  RAISE NOTICE '✓ Next bugs will have correct sequential IDs';
END $$;

-- Step 2: Show current state
SELECT 
  p.name as project_name,
  p.id as project_id,
  COALESCE(pbc.counter, 0) as current_counter,
  COUNT(b.id) as actual_bugs
FROM projects p
LEFT JOIN project_bug_counter pbc ON p.id = pbc.project_id
LEFT JOIN bugs b ON p.id = b.project_id
GROUP BY p.id, p.name, pbc.counter
ORDER BY p.created_at DESC;


