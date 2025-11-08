# 🔒 Security Setup Instructions

## ✅ Security Fixes Applied

The following security improvements have been implemented:

1. ✅ **Supabase Auth Integration** - Replaced localStorage with proper authentication
2. ✅ **File Validation** - Added type and size limits for uploads
3. ✅ **Environment Variables** - Credentials moved to `.env.local`

## 📋 Setup Steps

### Step 1: Create Environment File

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://twqyzkwvulgcfhzfjbea.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3cXl6a3d2dWxnY2ZoemZqYmVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzI1NDUsImV4cCI6MjA3NTYwODU0NX0.tEjlDCEUMB9NEo5l7E-ZgwC8zgg3V2f9JVhX-h6HUFo
```

### Step 2: Set Up Supabase Auth

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"** or **"Invite User"**
4. Create a user with:
   - **Email**: `kavin@boostmysites.com`
   - **Password**: `TracepoinT777`
   - **Auto Confirm**: ✅ (check this to skip email verification)

**OR** use the Supabase CLI to create the user:

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref twqyzkwvulgcfhzfjbea

# Create admin user
supabase db execute "
  INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES (
    'kavin@boostmysites.com',
    crypt('TracepoinT777', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  );
"
```

### Step 3: Update RLS Policies (CRITICAL)

1. Go to Supabase Dashboard → **SQL Editor**
2. Open the file `update-rls-policies.sql`
3. Copy and paste the entire SQL script
4. Click **"Run"** to execute

**⚠️ IMPORTANT**: This will restrict database access to authenticated users only. Make sure you've created the admin user first (Step 2)!

### Step 4: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. You should be redirected to `/login`
4. Login with:
   - Email: `kavin@boostmysites.com`
   - Password: `TracepoinT777`

5. Verify:
   - ✅ Login works
   - ✅ Projects load
   - ✅ Bugs can be created/edited
   - ✅ File uploads work with validation

## 🔍 Verification Checklist

After setup, verify:

- [ ] `.env.local` file exists with correct values
- [ ] Admin user created in Supabase Auth
- [ ] RLS policies updated (run SQL script)
- [ ] Login page works with email/password
- [ ] Dashboard loads after login
- [ ] File uploads validate type and size
- [ ] Logout works correctly

## 🚨 Troubleshooting

### "Invalid login credentials"
- Check that user exists in Supabase Auth
- Verify email is correct (case-sensitive)
- Check password is correct

### "Missing NEXT_PUBLIC_SUPABASE_URL"
- Ensure `.env.local` file exists
- Restart dev server after creating `.env.local`

### "Permission denied" errors
- Verify RLS policies were updated
- Check that user is authenticated (check Supabase Auth)
- Ensure policies use `auth.role() = 'authenticated'`

### Database access issues
- Check RLS policies in Supabase Dashboard
- Verify policies are enabled on tables
- Check Supabase logs for errors

## 📝 Next Steps (Future Improvements)

1. **User-Project Relationships**
   - Create `project_users` table
   - Link users to specific projects
   - Restrict access based on project membership

2. **Role-Based Access Control**
   - Add user roles (admin, developer, viewer)
   - Restrict actions based on role
   - Only admins can delete projects

3. **Audit Logging**
   - Track all create/update/delete operations
   - Log IP addresses and timestamps
   - Security incident investigation

4. **Storage Security**
   - Make storage bucket private
   - Use signed URLs with expiration
   - Add access control per file

## 📚 Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [RLS Policy Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Security Status**: ✅ Phase 1 Critical Fixes Complete

