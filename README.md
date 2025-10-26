# Bug Tracker

A simple bug tracking web application built with Next.js and Supabase.

## Features

- Create and manage projects
- Track bugs with detailed information including:
  - Bug ID (auto-generated)
  - Priority levels (Low, Medium, High, Critical)
  - Bug name and description
  - Developer notes
  - Status tracking (Open, In Progress, Resolved, Closed)
- Modern, responsive UI with Tailwind CSS
- Real-time updates with Supabase

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd bug-tracker
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project dashboard and navigate to Settings > API
3. Copy your project URL and anon key
4. Update the `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Set up the Database

1. In your Supabase dashboard, go to the SQL Editor
2. Copy and paste the contents of `supabase-schema.sql` into the editor
3. Run the SQL to create the necessary tables and policies

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. **Create a Project**: Click "New Project" to create a new bug tracking project
2. **View Projects**: See all your projects on the main dashboard
3. **Open Project**: Click on any project to view its bug tracker
4. **Add Bugs**: Click "Add Bug" to report new bugs
5. **Edit Bugs**: Click "Edit" on any bug to modify its details
6. **Update Status**: Change bug status as you work on them
7. **Delete Bugs**: Remove bugs that are no longer needed

## Database Schema

### Projects Table
- `id`: UUID primary key
- `name`: Project name (required)
- `description`: Optional project description
- `created_at`: Timestamp

### Bugs Table
- `id`: UUID primary key
- `project_id`: Foreign key to projects table
- `bug_id`: Human-readable bug identifier (auto-generated)
- `priority`: Bug priority (low, medium, high, critical)
- `name`: Bug name (required)
- `description`: Detailed bug description
- `developer_notes`: Developer notes and workarounds
- `status`: Bug status (open, in_progress, resolved, closed)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Backend as a Service (database, auth, real-time)
- **React Hooks** - State management

## License

MIT