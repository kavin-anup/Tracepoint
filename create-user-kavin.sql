-- ============================================
-- CREATE AUTHENTICATED USER: kavin@boostmysites.com
-- ============================================
-- This SQL creates a user in Supabase Auth
-- Password: TracepoinT777
-- ============================================

-- Method 1: Using Supabase's built-in auth functions (Recommended)
-- Note: This requires the pgcrypto extension to be enabled

-- First, ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert user into auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- instance_id (default)
  gen_random_uuid(), -- Generate a unique ID
  'authenticated', -- aud (audience)
  'authenticated', -- role
  'kavin@boostmysites.com', -- email
  crypt('TracepoinT777', gen_salt('bf')), -- encrypted password using bcrypt
  NOW(), -- email_confirmed_at (mark as confirmed)
  NULL, -- recovery_sent_at
  NULL, -- last_sign_in_at
  '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
  '{}', -- raw_user_meta_data
  NOW(), -- created_at
  NOW(), -- updated_at
  '', -- confirmation_token
  '', -- email_change
  '', -- email_change_token_new
  '' -- recovery_token
)
ON CONFLICT (email) DO NOTHING; -- Prevent duplicate if user already exists

-- ============================================
-- ALTERNATIVE METHOD (If above doesn't work)
-- ============================================
-- Use Supabase's REST API or Dashboard instead:
-- 
-- Option A: Via Supabase Dashboard
-- 1. Go to Authentication > Users
-- 2. Click "Add User" or "Invite User"
-- 3. Enter email: kavin@boostmysites.com
-- 4. Set password: TracepoinT777
-- 5. Auto-confirm the user
--
-- Option B: Via Supabase Management API
-- Use the service role key to call:
-- POST https://twqyzkwvulgcfhzfjbea.supabase.co/auth/v1/admin/users
-- Headers: 
--   Authorization: Bearer YOUR_SERVICE_ROLE_KEY
--   apikey: YOUR_SERVICE_ROLE_KEY
-- Body:
--   {
--     "email": "kavin@boostmysites.com",
--     "password": "TracepoinT777",
--     "email_confirm": true
--   }

-- ============================================
-- VERIFY USER WAS CREATED
-- ============================================
-- Run this to check if user exists:
-- SELECT id, email, email_confirmed_at, created_at 
-- FROM auth.users 
-- WHERE email = 'kavin@boostmysites.com';

-- ============================================
-- NOTES
-- ============================================
-- 1. The user will have full access to all projects and bugs
--    because our RLS policies allow authenticated users to:
--    - Create/edit/delete projects
--    - Create/edit/delete bugs
--
-- 2. The user can login at: /login
--    Email: kavin@boostmysites.com
--    Password: TracepoinT777
--
-- 3. If the SQL method doesn't work, use the Supabase Dashboard
--    (Authentication > Users > Add User) which is the recommended way

