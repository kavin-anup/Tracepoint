# Troubleshooting Guide

## Issue 1: TP-0 Example Bug Not Appearing

### Why This Happens:
The TP-0 example bug feature was added AFTER your project was created. Only **NEW** projects get the example bug automatically.

### Solution Option 1: Create a New Test Project
1. Go to the dashboard (home page)
2. Click "New Project"
3. Create a project called "Test Project 2"
4. Open it
5. You should see TP-0 example bug! ✅

### Solution Option 2: Manually Add TP-0 to Existing Project
If you want TP-0 in your existing project:

1. Open Supabase SQL Editor
2. Run this query (replace `YOUR_PROJECT_ID` with your actual project ID from the URL):

```sql
INSERT INTO bugs (
  project_id,
  portal,
  priority,
  status,
  assigned_to,
  module_feature,
  bug_description,
  bug_link,
  client_notes,
  developer_notes
) VALUES (
  'YOUR_PROJECT_ID',  -- Replace with actual project ID
  'Customer Side',
  'Minor',
  'Not a Bug',
  'Developer',
  'Example Bug',
  'Please give us a detailed description of the bug or the issue you would like clarity on',
  'Please attach any links of screenshots/videos to help reproduce the bug',
  'Clients can add context or feedback to the bugs',
  'Developers will provide updates if any in this section'
);
```

**To find your project ID:**
- Look at the URL: `http://localhost:3000/project/7d15c507-5679-4899-8cd0-37cfaa8bea95`
- The ID is: `7d15c507-5679-4899-8cd0-37cfaa8bea95`

---

## Issue 2: Create Bug Button Not Working

### Possible Causes:

#### 1. Browser Cache Issue
The app might be using old cached JavaScript.

**Solution:**
1. **Hard refresh** the page:
   - Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
   - Mac: `Cmd + Shift + R`
2. Or clear browser cache:
   - Press `F12` to open DevTools
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

#### 2. Old Default Values
If you see wrong defaults (e.g., Priority = "Major" instead of "Minor"):

**Solution:**
1. Stop the development server (Ctrl+C in terminal)
2. Restart it:
   ```powershell
   cd bug-tracker
   npm run dev
   ```
3. Hard refresh the browser (Ctrl+Shift+R)

#### 3. Check Browser Console for Errors
1. Press `F12` to open DevTools
2. Click the "Console" tab
3. Try to create a bug again
4. Look for red error messages
5. Share the error message for help

#### 4. Database Trigger Issue
The bug_id auto-generation might not be working.

**Check:**
1. Open Supabase Dashboard
2. Go to "Database" → "Functions"
3. Look for `generate_project_bug_id`
4. Should exist ✅

**If missing, re-run:**
1. Open `migration-project-specific-bug-ids.sql`
2. Copy all contents
3. Paste in Supabase SQL Editor
4. Click "Run"

---

## Issue 3: Wrong Default Values Showing

### If you see:
- Portal: "Admin Panel" instead of "Customer Side"
- Priority: "Major" or "Medium" instead of "Minor"

### This means the browser is using cached old code.

**Solution:**
1. **Stop the dev server** in terminal (Ctrl+C)
2. **Clear Next.js cache:**
   ```powershell
   cd bug-tracker
   rm -r .next
   ```
   Or on Windows:
   ```powershell
   cd bug-tracker
   rmdir /s .next
   ```
   (Press Y when asked to confirm)
3. **Restart the server:**
   ```powershell
   npm run dev
   ```
4. **Hard refresh browser** (Ctrl+Shift+R)

---

## Issue 4: Bug IDs Not Project-Specific

### If you see:
- Project 1: TP-1, TP-2, TP-3
- Project 2: TP-4, TP-5 (continuing from Project 1)

### This means the migration didn't run properly.

**Solution:**
1. Open Supabase SQL Editor
2. Check if `project_bug_counter` table exists:
   ```sql
   SELECT * FROM project_bug_counter;
   ```
3. If error "table does not exist":
   - Re-run `migration-project-specific-bug-ids.sql`
4. If table exists but still not working:
   - Check if trigger exists:
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgname = 'set_project_bug_id';
   ```
5. If no results, re-run the migration script

---

## Issue 5: Custom Dropdown Options Missing

### If custom options disappear after page refresh:

**This is normal!** Custom options are stored **per-project** in your browser's localStorage.

**Check:**
1. Make sure you're in the same project
2. Try adding a custom option again
3. Refresh the page
4. Should still be there ✅

**If still missing:**
1. Press F12 → Console tab
2. Type:
   ```javascript
   localStorage.getItem('custom_portal_options_YOUR_PROJECT_ID')
   ```
   (Replace YOUR_PROJECT_ID with actual ID from URL)
3. Should show your custom options

---

## Quick Fixes Summary:

| Problem | Quick Fix |
|---------|-----------|
| TP-0 not appearing | Create a new project to test |
| Create Bug button not working | Hard refresh (Ctrl+Shift+R) |
| Wrong default values | Clear .next folder, restart server |
| Bug IDs not project-specific | Re-run migration script |
| Can't add custom options | Check browser console for errors |

---

## Getting Fresh Start:

If nothing works, here's how to start completely fresh:

### 1. Clear Browser Data:
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"

### 2. Restart Dev Server:
```powershell
# In terminal where server is running
Ctrl+C  # Stop server

# Delete Next.js cache
cd bug-tracker
rmdir /s .next  # Windows
# or
rm -rf .next    # Mac/Linux

# Restart
npm run dev
```

### 3. Hard Refresh Browser:
`Ctrl + Shift + R`

---

## Still Having Issues?

### Check These:

1. **Is the dev server running?**
   - Should see: `✓ Ready on http://localhost:3000`

2. **Is Supabase connected?**
   - Check `.env.local` file exists
   - Has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Did migration run successfully?**
   - Should see success message in Supabase
   - No red errors

4. **Browser console clean?**
   - Press F12 → Console
   - Should be no red errors

---

## Debug Mode:

To see what's happening when creating a bug:

1. Open browser console (F12 → Console)
2. Try to create a bug
3. You should see:
   ```
   Creating bug with data: {...}
   Bug created successfully: {...}
   ```
4. If you see errors, that tells us what's wrong!

---

## Contact for Help:

When reporting an issue, please provide:

1. **Screenshot** of the problem
2. **Browser console errors** (F12 → Console → screenshot any red errors)
3. **Steps to reproduce**
4. **What you expected vs what happened**

This helps diagnose the issue quickly! 🚀


