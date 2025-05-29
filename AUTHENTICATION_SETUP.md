# Authentication Setup & Troubleshooting Guide

This guide will help you fix authentication issues in the Aditi Daily Updates system.

## Quick Fix for Login Issues

### 1. Environment Variables Setup

Create a `.env.local` file in your project root with these values:

```env
# Get these from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**How to get these values:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the Project URL and anon public key
5. Copy the service_role key (keep this secure!)

### 2. Database Setup

Visit `/setup` in your application to:
- Test database connection
- Create necessary tables
- Add test users with known passwords
- Troubleshoot common issues

### 3. Test Accounts

After running the setup, use these test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | admin123456 |
| Manager | manager@test.com | manager123456 |
| User | user@test.com | user123456 |
| Developer | developer@test.com | developer123456 |

## Common Issues & Solutions

### ❌ "Invalid login credentials"

**Causes:**
- User doesn't exist in Supabase Auth
- Wrong password
- Email not verified
- User exists but not in database tables

**Solutions:**
1. Use the test accounts provided above
2. Check if user exists in Supabase Auth dashboard
3. Enable debug mode in the login form
4. Run database setup to create test users

### ❌ "Email not confirmed"

**Causes:**
- User signed up but didn't verify email
- Email verification required in Supabase settings

**Solutions:**
1. Check spam folder for verification email
2. Use test accounts (pre-verified)
3. In Supabase dashboard, manually confirm user email
4. Disable email confirmation in Supabase Auth settings (for testing)

### ❌ "Not assigned to any team"

**Causes:**
- User authenticated but not in database tables
- Missing admin/manager/team member records

**Solutions:**
1. Run database setup to create test data
2. Add user to `aditi_team_members` table
3. Add user to `aditi_admins` table (for admin access)

### ❌ "Connection failed" / Database errors

**Causes:**
- Wrong Supabase credentials
- Tables don't exist
- Network issues

**Solutions:**
1. Check environment variables
2. Test connection in `/setup` page
3. Run database setup to create tables
4. Check Supabase project status

## Manual Database Setup

If the automatic setup doesn't work, run these SQL commands in your Supabase SQL editor:

```sql
-- Create admin table
CREATE TABLE IF NOT EXISTS aditi_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS aditi_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  manager_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team members table
CREATE TABLE IF NOT EXISTS aditi_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES aditi_teams(id) ON DELETE CASCADE,
  employee_email TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  team_member_name TEXT NOT NULL,
  manager_name TEXT,
  team_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, employee_email)
);

-- Add test admin
INSERT INTO aditi_admins (email, name) 
VALUES ('admin@test.com', 'Test Admin')
ON CONFLICT (email) DO NOTHING;

-- Add test team
INSERT INTO aditi_teams (team_name, manager_email) 
VALUES ('Development Team', 'manager@test.com')
ON CONFLICT DO NOTHING;

-- Get team ID and add test member
INSERT INTO aditi_team_members (
  team_id, 
  employee_email, 
  employee_id, 
  team_member_name, 
  manager_name, 
  team_name
)
SELECT 
  t.id,
  'user@test.com',
  'EMP001',
  'Test User',
  'Test Manager',
  'Development Team'
FROM aditi_teams t 
WHERE t.team_name = 'Development Team'
ON CONFLICT (team_id, employee_email) DO NOTHING;

-- Disable RLS for testing (enable in production)
ALTER TABLE aditi_admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE aditi_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE aditi_team_members DISABLE ROW LEVEL SECURITY;
```

## Creating Auth Users

In Supabase Auth dashboard, manually create users or use the Auth API:

```javascript
// Example: Create test user via Supabase dashboard
// Go to Authentication > Users > Add User
// Email: admin@test.com
// Password: admin123456
// Confirm email: Yes
```

## Debug Mode

The login form has a debug mode that shows:
- Whether user exists in auth
- Email confirmation status
- Role assignments
- Database table status

Enable it by clicking "Show Debug Info" on the login form.

## Production Considerations

Before deploying to production:

1. **Re-enable RLS**: Row Level Security should be enabled
2. **Remove test accounts**: Delete test users and data
3. **Secure environment variables**: Use proper secrets management
4. **Email verification**: Enable email confirmation requirements
5. **Strong passwords**: Enforce proper password policies

## Support

If you're still having issues:

1. Check the browser console for error messages
2. Check Supabase logs in the dashboard
3. Use the `/setup` page for diagnostics
4. Enable debug mode for detailed information
5. Verify all environment variables are set correctly

## Troubleshooting Checklist

- [ ] Environment variables are set in `.env.local`
- [ ] Supabase project is active and accessible
- [ ] Database tables exist (use `/setup` to create)
- [ ] Test users are created in Supabase Auth
- [ ] Users are assigned to teams/roles in database
- [ ] Network connection to Supabase is working
- [ ] Browser console shows no critical errors 