import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const results: {
      tablesCreated: string[];
      usersAdded: string[];
      errors: string[];
    } = {
      tablesCreated: [],
      usersAdded: [],
      errors: []
    };

    // 1. Ensure admin table exists and add test admins
    try {
      // Create admin table if it doesn't exist
      const { error: adminTableError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS aditi_admins (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL UNIQUE,
            name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_login TIMESTAMP WITH TIME ZONE
          );
        `
      });

      if (!adminTableError) {
        results.tablesCreated.push('aditi_admins');
      }

      // Add test admin users
      const testAdmins = [
        { email: 'anubhav.chaudhary@aditiconsulting.com', name: 'Anubhav Chaudhary' },
        { email: 'anubhavchaudhary459@gmail.com', name: 'Anubhav Chaudhary' },
        { email: 'shivaku@aditiconsulting.com', name: 'Shiva' },
        { email: 'admin@test.com', name: 'Test Admin' }
      ];

      for (const admin of testAdmins) {
        const { error } = await supabase
          .from('aditi_admins')
          .upsert(admin, { onConflict: 'email' });
        
        if (!error) {
          results.usersAdded.push(`Admin: ${admin.email}`);
        }
      }
    } catch (error) {
      results.errors.push(`Admin setup error: ${error}`);
    }

    // 2. Ensure teams table exists and add test data
    try {
      const { error: teamsTableError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS aditi_teams (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            team_name TEXT NOT NULL,
            manager_email TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (!teamsTableError) {
        results.tablesCreated.push('aditi_teams');
      }

      // Add test teams
      const testTeams = [
        { team_name: 'Development Team', manager_email: 'manager@test.com' },
        { team_name: 'QA Team', manager_email: 'qa.manager@test.com' },
        { team_name: 'Design Team', manager_email: 'design.manager@test.com' }
      ];

      for (const team of testTeams) {
        const { error } = await supabase
          .from('aditi_teams')
          .upsert(team, { onConflict: 'team_name' });
        
        if (!error) {
          results.usersAdded.push(`Team: ${team.team_name}`);
        }
      }
    } catch (error) {
      results.errors.push(`Teams setup error: ${error}`);
    }

    // 3. Ensure team members table exists and add test data
    try {
      const { error: membersTableError } = await supabase.rpc('exec', {
        sql: `
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
        `
      });

      if (!membersTableError) {
        results.tablesCreated.push('aditi_team_members');
      }

      // Get team IDs for test data
      const { data: teams } = await supabase
        .from('aditi_teams')
        .select('id, team_name');

      if (teams && teams.length > 0) {
        const devTeam = teams.find(t => t.team_name === 'Development Team');
        
        if (devTeam) {
          const testMembers = [
            {
              team_id: devTeam.id,
              employee_email: 'user@test.com',
              employee_id: 'EMP001',
              team_member_name: 'Test User',
              manager_name: 'Test Manager',
              team_name: devTeam.team_name
            },
            {
              team_id: devTeam.id,
              employee_email: 'developer@test.com',
              employee_id: 'EMP002',
              team_member_name: 'Test Developer',
              manager_name: 'Test Manager',
              team_name: devTeam.team_name
            }
          ];

          for (const member of testMembers) {
            const { error } = await supabase
              .from('aditi_team_members')
              .upsert(member, { onConflict: 'team_id,employee_email' });
            
            if (!error) {
              results.usersAdded.push(`Team Member: ${member.employee_email}`);
            }
          }
        }
      }
    } catch (error) {
      results.errors.push(`Team members setup error: ${error}`);
    }

    // 4. Create some auth users if they don't exist
    try {
      const testUsers = [
        { email: 'admin@test.com', password: 'admin123456' },
        { email: 'manager@test.com', password: 'manager123456' },
        { email: 'user@test.com', password: 'user123456' },
        { email: 'developer@test.com', password: 'developer123456' }
      ];

      for (const user of testUsers) {
        try {
          const { data, error } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true, // Skip email verification for test users
            user_metadata: {
              name: user.email.split('@')[0]
            }
          });

          if (!error && data.user) {
            results.usersAdded.push(`Auth User: ${user.email}`);
          }
        } catch (authError) {
          // User might already exist, that's okay
          console.log(`User ${user.email} might already exist`);
        }
      }
    } catch (error) {
      results.errors.push(`Auth users setup error: ${error}`);
    }

    // 5. Disable RLS for easier testing (re-enable in production)
    try {
      await supabase.rpc('exec', {
        sql: `
          ALTER TABLE aditi_admins DISABLE ROW LEVEL SECURITY;
          ALTER TABLE aditi_teams DISABLE ROW LEVEL SECURITY;
          ALTER TABLE aditi_team_members DISABLE ROW LEVEL SECURITY;
        `
      });
      results.usersAdded.push('RLS disabled for testing');
    } catch (error) {
      results.errors.push(`RLS disable error: ${error}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Database setup completed',
      results,
      testCredentials: {
        admin: { email: 'admin@test.com', password: 'admin123456' },
        manager: { email: 'manager@test.com', password: 'manager123456' },
        user: { email: 'user@test.com', password: 'user123456' },
        developer: { email: 'developer@test.com', password: 'developer123456' }
      }
    });

  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 