# Tracepoint - Complete Codebase & Database Analysis

## Project Overview

**Tracepoint** is a bug tracking and project management web application built with Next.js 15, TypeScript, Tailwind CSS, and Supabase. It allows teams to manage multiple projects and track bugs with detailed information, notes, attachments, and status history.

---

## 1. CODEBASE STRUCTURE

### Directory Layout
```
/Users/animesh/Documents/BoostMySites/Tracepoint/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx             # Main dashboard (project list)
│   │   ├── layout.tsx           # Root layout
│   │   ├── globals.css          # Global styles
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   └── project/
│   │       └── [id]/
│   │           └── page.tsx    # Individual project page
│   ├── components/
│   │   ├── BugForm.tsx         # Bug create/edit form
│   │   ├── ProjectForm.tsx     # Project create form
│   │   └── EditableDropdown.tsx # Custom dropdown component
│   ├── lib/
│   │   └── supabase.ts         # Supabase client & TypeScript types
│   └── middleware.ts            # Next.js middleware (redirects)
├── public/                      # Static assets
│   ├── logo.png
│   └── background.jpg
├── supabase-schema-v2.sql      # Latest database schema
├── package.json                 # Dependencies
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript config
└── [various .md documentation files]
```

---

## 2. CORE COMPONENTS ANALYSIS

### 2.1 Main Dashboard (`src/app/page.tsx`)
**Purpose**: Landing page showing all projects with search and filtering

**Key Features**:
- Authentication check (localStorage-based)
- Project listing with colorful card design
- Search functionality (by name/description)
- Bug count display (total and open bugs)
- Project creation/deletion
- Opens projects in new tabs

**State Management**:
- `projects` - Array of projects with bug counts
- `showProjectForm` - Toggle project creation modal
- `isAuthenticated` - Auth status
- `searchQuery` - Filter projects

**Notable Code Patterns**:
```typescript
// Projects fetch with bug counts
const projectsWithCounts = await Promise.all(
  (data || []).map(async (project) => {
    const { count } = await supabase.from('bugs')...
    return { ...project, bugCount: count }
  })
)
```

**Design**: Glassmorphism UI with colored project cards, backdrop blur effects

---

### 2.2 Project Page (`src/app/project/[id]/page.tsx`)
**Purpose**: Detailed view of a single project with bug table

**Key Features**:
- Two-column layout: Project Details + Current Status
- Editable project details (name, description, additional info)
- Bug table with filtering (portal, status, priority, assigned to)
- Custom dropdown management (add/delete options per project)
- Bug viewing popup with full details
- File attachments display
- Status history tracking
- Notes history (client & developer)

**State Management**:
- `project` - Project details
- `bugs` - Array of bugs for this project
- `showBugForm` / `editingBug` / `viewingBug` - Modal states
- Filter states: `filterPortal`, `filterStatus`, `filterPriority`, `filterAssignedTo`
- Custom dropdown options (stored in localStorage per project)

**Table Columns**:
1. Bug ID
2. Portal
3. Priority
4. Bug Title (Module/Feature)
5. Bug Description
6. Status
7. Assigned To
8. Reference (attachments with icons)
9. Client Notes (latest)
10. Developer Notes (latest)
11. Date Added
12. Actions (Edit/Delete)

**Notable Features**:
- Color-coded badges (priority, status, portal, assigned to)
- Line clamping for truncated text
- Click row to view full bug details
- Attachment icons (image, video, PDF, file)
- Previous notes display in edit form
- Project-specific custom dropdowns stored in localStorage

---

### 2.3 Bug Form (`src/components/BugForm.tsx`)
**Purpose**: Create/edit bugs with rich features

**Key Features**:
- Dynamic form for new bugs or editing existing ones
- File upload to Supabase Storage (`bug-attachments` bucket)
- Notes system with timestamps (client & developer)
- Previous notes display (sorted by timestamp)
- Status history tracking
- Custom dropdown options (per project)

**Form Fields**:
- Bug ID (read-only when editing)
- Portal (dropdown)
- Priority (dropdown)
- Status (dropdown)
- Assigned To (dropdown)
- Bug Title (Module/Feature)
- Bug Description (textarea)
- Attachments (multiple file upload)
- Client Notes (textarea + history)
- Developer Notes (textarea + history)

**File Upload Process**:
```typescript
// Upload to Supabase Storage
const { error } = await supabase.storage
  .from('bug-attachments')
  .upload(filePath, file)

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('bug-attachments')
  .getPublicUrl(filePath)
```

**Notes System**:
- Notes are arrays of `{note: string, timestamp: string}` objects
- Latest note displayed first
- Numbered chronologically (oldest = Note 1)
- When editing, textbox is empty and all previous notes are shown

**Custom Dropdowns**:
- Default options + custom options
- Stored per project in localStorage
- Keys: `custom_portal_options_{projectId}`, etc.

---

### 2.4 Project Form (`src/components/ProjectForm.tsx`)
**Purpose**: Simple modal for creating new projects

**Fields**:
- Project Name (required)
- Description (optional)

**Behavior**:
- On submit, creates project in database
- Automatically creates example bug "TP-0" for new projects

---

### 2.5 Login Page (`src/app/login/page.tsx`)
**Purpose**: Simple authentication

**Credentials** (hardcoded):
- Username: `kavin@boostmysites.com`
- Password: `TracepoinT777`

**Authentication**:
- Uses localStorage (`isAuthenticated: 'true'`)
- No JWT or session management
- Redirects to dashboard on success

---

### 2.6 Supabase Client (`src/lib/supabase.ts`)
**Purpose**: Configure Supabase and define TypeScript types

**Features**:
- Lazy initialization to avoid build-time errors
- Proxy pattern for client access
- TypeScript database types for type safety

**TypeScript Types**:
```typescript
Database = {
  public: {
    Tables: {
      projects: { Row, Insert, Update }
      bugs: { Row, Insert, Update }
    }
  }
}
```

**Key Types**:
- `client_notes` & `developer_notes`: Array<{note: string, timestamp: string}>
- `status_history`: Array<{status: string, timestamp: string}>
- `attachments`: Array<{name: string, url: string, size: number, type: string}>

---

### 2.7 Middleware (`src/middleware.ts`)
**Purpose**: Handle domain redirects

**Behavior**:
- Redirects `www.tracepoint.vercel.app` → `tracepoint.vercel.app` (301)
- Applies to all routes except API, static files, and images

---

## 3. DATABASE STRUCTURE (SUPABASE)

### 3.1 Connection Details
- **Supabase URL**: `https://twqyzkwvulgcfhzfjbea.supabase.co`
- **Project Ref**: `twqyzkwvulgcfhzfjbea`
- **Region**: AWS ap-southeast-1 (Singapore)
- **Database**: PostgreSQL 15+

### 3.2 Tables Overview

#### **Table: `projects`**
```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_details TEXT,  -- Rich text field for URLs, credentials, notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns**:
- `id` - UUID primary key
- `name` - Project name (required)
- `description` - Short description
- `project_details` - Large text field for additional info
- `created_at` / `updated_at` - Timestamps (auto-managed)

**Current Data**:
- 8 projects in database
- Examples: "TWAP Website", "Ecosphere", "crm.boostmysites.com"

---

#### **Table: `bugs`**
```sql
CREATE TABLE bugs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bug_id TEXT NOT NULL UNIQUE,  -- Auto-generated: TP-1, TP-2, ...
  portal TEXT NOT NULL DEFAULT 'Admin Panel',
  priority TEXT NOT NULL DEFAULT 'Medium',
  module_feature TEXT,  -- Bug title
  bug_description TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  assigned_to TEXT NOT NULL DEFAULT 'Developer',
  bug_link TEXT,  -- Deprecated/unused
  client_notes JSONB,  -- Array of {note, timestamp}
  developer_notes JSONB,  -- Array of {note, timestamp}
  attachments JSONB,  -- Array of {name, url, size, type}
  status_history JSONB,  -- Array of {status, timestamp}
  date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns**:
- `id` - UUID primary key
- `project_id` - Foreign key to projects (CASCADE DELETE)
- `bug_id` - Auto-generated unique ID (TP-1, TP-2, ...)
- `portal` - Admin Panel / Customer Side / Custom
- `priority` - Minor / Medium / Major / Critical / Custom
- `module_feature` - Bug title/location
- `bug_description` - Detailed description
- `status` - Open / In Progress / Closed / etc.
- `assigned_to` - Developer / Frontend / Backend / Custom
- `bug_link` - Legacy field (not used in current UI)
- `client_notes` - JSONB array
- `developer_notes` - JSONB array
- `attachments` - JSONB array
- `status_history` - JSONB array
- `date_added` / `created_at` / `updated_at` - Timestamps

**JSONB Structures**:
```typescript
client_notes: Array<{
  note: string
  timestamp: string  // ISO 8601
}>

attachments: Array<{
  name: string
  url: string  // Public URL from Supabase Storage
  size: number  // bytes
  type: string  // MIME type
}>

status_history: Array<{
  status: string
  timestamp: string
}>
```

**Current Data**:
- 46 bugs in database
- Bug IDs range from TP-0 (example bug) to higher numbers

**Indexes**:
- `idx_bugs_project_id` on `project_id`
- `idx_bugs_priority` on `priority`
- `idx_bugs_status` on `status`
- `idx_bugs_date_added` on `date_added`
- `idx_bugs_bug_id` on `bug_id` (unique)

---

#### **Table: `bug_id_counter`**
```sql
CREATE TABLE bug_id_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  counter INTEGER NOT NULL DEFAULT 0
);
```

**Purpose**: Global counter for sequential bug IDs

**Columns**:
- `id` - Always 1 (single row)
- `counter` - Current bug number

**Usage**: Incremented by trigger when new bug is inserted

---

### 3.3 Database Functions & Triggers

#### Function: `generate_bug_id()`
```sql
CREATE OR REPLACE FUNCTION generate_bug_id()
RETURNS TEXT AS $$
DECLARE
  new_counter INTEGER;
BEGIN
  UPDATE bug_id_counter SET counter = counter + 1 
  WHERE id = 1 RETURNING counter INTO new_counter;
  RETURN 'TP-' || new_counter;
END;
$$ LANGUAGE plpgsql;
```

**Purpose**: Generate sequential bug IDs (TP-1, TP-2, ...)

---

#### Function: `set_bug_id()`
```sql
CREATE OR REPLACE FUNCTION set_bug_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bug_id IS NULL OR NEW.bug_id = '' THEN
    NEW.bug_id := generate_bug_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger**: `auto_generate_bug_id` (BEFORE INSERT on `bugs`)

---

#### Function: `update_updated_at_column()`
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Triggers**:
- `update_projects_updated_at` (BEFORE UPDATE on `projects`)
- `update_bugs_updated_at` (BEFORE UPDATE on `bugs`)

---

### 3.4 Row Level Security (RLS)

**Status**: ENABLED on all tables

**Policies** (for public access):

**Projects**:
- `Enable read access for all users` - SELECT USING (true)
- `Enable insert access for all users` - INSERT WITH CHECK (true)
- `Enable update access for all users` - UPDATE USING (true)
- `Enable delete access for all users` - DELETE USING (true)

**Bugs**:
- `Enable read access for all users` - SELECT USING (true)
- `Enable insert access for all users` - INSERT WITH CHECK (true)
- `Enable update access for all users` - UPDATE USING (true)
- `Enable delete access for all users` - DELETE USING (true)

**Bug ID Counter**:
- `Enable read access for all users` - SELECT USING (true)
- `Enable update access for all users` - UPDATE USING (true)

**Note**: Currently all operations are public. No authentication required at database level.

---

### 3.5 Storage Buckets

**Bucket**: `bug-attachments`
- **Visibility**: Public
- **Purpose**: Store bug attachment files
- **Structure**: `{projectId}/{randomFileName}`
- **Access**: Public URLs via `getPublicUrl()`

**File Upload Process**:
1. User selects files in BugForm
2. Files uploaded to `bug-attachments/{projectId}/{timestamp}-{random}.{ext}`
3. Public URL retrieved and stored in bug's `attachments` JSONB array
4. Files displayed as icons in table and links in detail popup

---

## 4. AUTHENTICATION & SECURITY

### Current Implementation
- **Method**: localStorage-based (not secure)
- **Credentials**: Hardcoded in `login/page.tsx`
- **Session**: Stored as `localStorage.setItem('isAuthenticated', 'true')`
- **Protection**: Middleware checks on page load

### Security Concerns
⚠️ **NOT PRODUCTION-READY**:
- No server-side session validation
- Credentials in client-side code
- localStorage can be easily manipulated
- No JWT or OAuth
- Database RLS allows all operations

### Recommended Improvements
- Implement Supabase Auth
- Add proper session management
- Restrict database policies based on authenticated users
- Add API routes for server-side operations
- Environment variables for sensitive data

---

## 5. KEY FEATURES

### 5.1 Bug ID Generation
- Sequential IDs: TP-0, TP-1, TP-2, ...
- Application-wide unique
- Automatically generated via database trigger
- Counter stored in `bug_id_counter` table

### 5.2 Notes System
- **Client Notes**: For bug reporters/clients
- **Developer Notes**: For developers working on bugs
- Each note has timestamp
- Displayed chronologically (latest first in view)
- Numbered (oldest = Note 1)
- History preserved when editing

### 5.3 Status History
- Tracks all status changes
- Format: `{status: string, timestamp: string}[]`
- Displayed in edit form
- Shows progression of bug lifecycle

### 5.4 File Attachments
- Multiple files per bug
- Stored in Supabase Storage
- Public URLs
- File metadata stored in JSONB (name, size, type)
- Icon indicators (image/video/PDF/file)
- Clickable to view in new tab

### 5.5 Custom Dropdowns (Project-Specific)
- Default options: Portal, Priority, Status, Assigned To
- Add custom options per project
- Stored in localStorage with key format: `custom_{field}_options_{projectId}`
- Custom options can be deleted
- Displayed with distinct styling (blue box)

### 5.6 Filtering & Search
- **Projects**: Search by name or description
- **Bugs**: Filter by portal, status, priority, assigned to
- Real-time filter application
- Display count of filtered results

### 5.7 UI/UX Features
- Glassmorphism design
- Color-coded badges
- Responsive layout
- Modal popups for forms and details
- Text wrapping and line clamping
- Hover effects
- Loading states
- Confirmation dialogs

---

## 6. TECHNOLOGY STACK

### Frontend
- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Library**: React 19.1.0
- **Font**: Geist Sans

### Backend
- **BaaS**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **API**: Supabase JavaScript Client

### DevOps
- **Package Manager**: npm
- **Linting**: ESLint
- **Build Tool**: Next.js (Turbopack for dev)
- **Deployment**: Vercel (assumed from domain)

---

## 7. DATA FLOW

### Creating a Bug
1. User clicks "Add Bug" button
2. `BugForm` component renders with empty state
3. User fills fields, selects files
4. On submit:
   - Files uploaded to Supabase Storage
   - Public URLs retrieved
   - Bug data + attachment URLs + notes sent to Supabase
   - Trigger generates bug_id (TP-X)
   - Bug inserted into `bugs` table
5. UI refreshes bug list

### Editing a Bug
1. User clicks "Edit" or clicks row → "Edit Bug"
2. `BugForm` renders with bug data pre-filled
3. Previous notes moved to "Previous Notes" section
4. User modifies fields, adds new note/files
5. On submit:
   - New files uploaded
   - New note appended to notes array
   - Status change recorded in status_history
   - Bug updated in database
6. UI refreshes

### Viewing Project
1. User clicks project card
2. Opens in new tab: `/project/{id}`
3. Project details fetched
4. Bugs for project fetched and filtered
5. Custom dropdown options loaded from localStorage
6. Table rendered with filtered bugs

---

## 8. NOTABLE CODE PATTERNS

### 8.1 Lazy Supabase Client Initialization
```typescript
// Prevents build-time errors when env vars not available
if (typeof window === 'undefined') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'placeholder'
  // ...
}
```

### 8.2 Async Project with Bug Counts
```typescript
const projectsWithCounts = await Promise.all(
  projects.map(async (project) => {
    const { count } = await supabase.from('bugs')...
    return { ...project, bugCount: count }
  })
)
```

### 8.3 JSONB Array Handling
```typescript
// Adding new note to existing notes array
let finalNotes = [...previousNotes]
if (currentNote.trim()) {
  finalNotes.push({
    note: currentNote.trim(),
    timestamp: new Date().toISOString()
  })
}
```

### 8.4 File Upload to Supabase Storage
```typescript
const filePath = `${projectId}/${Date.now()}-${random()}.${ext}`
await supabase.storage.from('bug-attachments').upload(filePath, file)
const { data: { publicUrl } } = supabase.storage
  .from('bug-attachments').getPublicUrl(filePath)
```

### 8.5 Event Propagation Control
```typescript
// Prevent popup when clicking Edit/Delete
<button onClick={(e) => {
  e.stopPropagation()
  handleEdit(bug)
}}>Edit</button>
```

---

## 9. CONFIGURATION FILES

### `package.json`
```json
{
  "name": "bug-tracker",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.75.0",
    "next": "15.5.4",
    "react": "19.1.0"
  }
}
```

### `next.config.ts`
- TypeScript configuration for Next.js
- App Router enabled

### `tsconfig.json`
- Strict mode enabled
- Path aliases: `@/*` → `./src/*`

### `vercel.json`
- Deployment configuration for Vercel

---

## 10. AREAS FOR IMPROVEMENT

### Security
1. Implement proper authentication (Supabase Auth)
2. Add user roles and permissions
3. Restrict database access via RLS
4. Move credentials to environment variables
5. Add CSRF protection

### Performance
1. Implement pagination for bug lists
2. Add caching for project data
3. Optimize image loading
4. Add loading skeletons
5. Debounce search inputs

### Features
1. Real-time updates (Supabase Realtime)
2. Email notifications
3. Bulk operations (delete/update multiple bugs)
4. Export to CSV/PDF
5. Bug templates
6. Comments system (separate from notes)
7. Time tracking
8. Bug dependencies
9. Version control for bug changes

### Code Quality
1. Add unit tests
2. Add integration tests
3. Error boundary components
4. Better TypeScript types
5. Extract magic numbers to constants
6. Add JSDoc comments

### UI/UX
1. Dark mode toggle
2. Customizable table columns
3. Drag-and-drop for attachments
4. Keyboard shortcuts
5. Undo/redo functionality
6. Better mobile experience

---

## 11. DEPLOYMENT

### Current Setup
- **Domain**: tracepoint.vercel.app
- **Platform**: Vercel (inferred)
- **Environment**: Production

### Environment Variables Needed
```env
NEXT_PUBLIC_SUPABASE_URL=https://twqyzkwvulgcfhzfjbea.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Build Command
```bash
npm run build
```

### Start Command
```bash
npm start
```

---

## 12. TROUBLESHOOTING

### Common Issues
1. **Build fails**: Check environment variables
2. **Database errors**: Verify RLS policies
3. **File upload fails**: Check storage bucket permissions
4. **Bug IDs not generating**: Check `bug_id_counter` table and triggers
5. **Custom dropdowns not persisting**: localStorage might be cleared

### Debug Mode
- Check browser console for errors
- Use Supabase dashboard to inspect data
- Verify network requests in DevTools

---

## SUMMARY

**Tracepoint** is a comprehensive bug tracking system with:
- ✅ Project management
- ✅ Detailed bug tracking
- ✅ File attachments
- ✅ Notes history
- ✅ Status tracking
- ✅ Custom dropdowns
- ✅ Filtering and search
- ✅ Modern UI with glassmorphism

**Tech Stack**: Next.js + TypeScript + Supabase + Tailwind

**Database**: PostgreSQL with 3 tables, triggers, and RLS

**Current Status**: Functional but needs production-ready authentication and optimizations

---

**Created**: January 2025  
**Last Updated**: November 8, 2025  
**Version**: 2.0

