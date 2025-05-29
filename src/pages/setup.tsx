import { useState } from 'react';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

export default function Setup() {
  const [isLoading, setIsLoading] = useState(false);
  const [setupResults, setSetupResults] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Not tested');

  const testConnection = async () => {
    try {
      setConnectionStatus('Testing...');
      
      const { data, error } = await supabase
        .from('aditi_teams')
        .select('count')
        .limit(1);
        
      if (error) {
        setConnectionStatus(`Error: ${error.message}`);
        toast.error(`Connection failed: ${error.message}`);
      } else {
        setConnectionStatus('Connected successfully');
        toast.success('Database connection successful');
      }
    } catch (err) {
      setConnectionStatus(`Failed: ${err}`);
      toast.error('Connection test failed');
    }
  };

  const runSetup = async () => {
    try {
      setIsLoading(true);
      toast.loading('Setting up database...', { id: 'setup' });
      
      const response = await fetch('/api/setup-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSetupResults(result);
        toast.success('Database setup completed!', { id: 'setup' });
      } else {
        toast.error(`Setup failed: ${result.error}`, { id: 'setup' });
      }
    } catch (error) {
      console.error('Setup error:', error);
      toast.error('Setup failed', { id: 'setup' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Database Setup | Aditi Daily Updates</title>
        <meta name="description" content="Set up test data for the Aditi Daily Updates system" />
      </Head>

      <div className="min-h-screen bg-[#1a1f2e] text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1e2538] rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Database Setup & Troubleshooting
              </h1>
              <a 
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
              >
                Back to Login
              </a>
            </div>

            <div className="space-y-6">
              {/* Connection Test */}
              <div className="bg-[#262d40] p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">1. Test Database Connection</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300 mb-2">
                      First, let's make sure we can connect to the database.
                    </p>
                    <p className={`text-sm font-medium ${
                      connectionStatus.includes('Error') || connectionStatus.includes('Failed')
                        ? 'text-red-400'
                        : connectionStatus.includes('successfully')
                          ? 'text-green-400'
                          : 'text-yellow-400'
                    }`}>
                      Status: {connectionStatus}
                    </p>
                  </div>
                  <button
                    onClick={testConnection}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                  >
                    Test Connection
                  </button>
                </div>
              </div>

              {/* Setup Database */}
              <div className="bg-[#262d40] p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">2. Initialize Test Data</h2>
                <div className="space-y-3">
                  <p className="text-sm text-gray-300">
                    This will create the necessary tables and add test users for authentication testing.
                  </p>
                  
                  <div className="bg-yellow-900/30 border border-yellow-700 rounded-md p-3">
                    <h3 className="text-sm font-medium text-yellow-300 mb-2">
                      This setup will create:
                    </h3>
                    <ul className="text-xs text-gray-300 list-disc pl-5 space-y-1">
                      <li>Admin users table with test admins</li>
                      <li>Teams and team members tables</li>
                      <li>Test authentication users with known passwords</li>
                      <li>Disable Row Level Security for easier testing</li>
                    </ul>
                  </div>

                  <button
                    onClick={runSetup}
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Setting up...' : 'Run Database Setup'}
                  </button>
                </div>
              </div>

              {/* Test Credentials */}
              <div className="bg-[#262d40] p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">3. Test Credentials</h2>
                <p className="text-sm text-gray-300 mb-4">
                  After running the setup, you can use these test accounts to log in:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#1a1f2e] p-3 rounded border border-gray-600">
                    <h3 className="text-sm font-medium text-green-400 mb-2">Admin Account</h3>
                    <p className="text-xs text-gray-300">Email: admin@test.com</p>
                    <p className="text-xs text-gray-300">Password: admin123456</p>
                  </div>
                  
                  <div className="bg-[#1a1f2e] p-3 rounded border border-gray-600">
                    <h3 className="text-sm font-medium text-blue-400 mb-2">Manager Account</h3>
                    <p className="text-xs text-gray-300">Email: manager@test.com</p>
                    <p className="text-xs text-gray-300">Password: manager123456</p>
                  </div>
                  
                  <div className="bg-[#1a1f2e] p-3 rounded border border-gray-600">
                    <h3 className="text-sm font-medium text-purple-400 mb-2">User Account</h3>
                    <p className="text-xs text-gray-300">Email: user@test.com</p>
                    <p className="text-xs text-gray-300">Password: user123456</p>
                  </div>
                  
                  <div className="bg-[#1a1f2e] p-3 rounded border border-gray-600">
                    <h3 className="text-sm font-medium text-orange-400 mb-2">Developer Account</h3>
                    <p className="text-xs text-gray-300">Email: developer@test.com</p>
                    <p className="text-xs text-gray-300">Password: developer123456</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded">
                  <p className="text-xs text-blue-300">
                    <strong>Note:</strong> These are test accounts with pre-verified emails. 
                    In production, users would need to verify their email addresses.
                  </p>
                </div>
              </div>

              {/* Setup Results */}
              {setupResults && (
                <div className="bg-[#262d40] p-4 rounded-lg">
                  <h2 className="text-lg font-semibold mb-3">Setup Results</h2>
                  
                  {setupResults.success ? (
                    <div className="space-y-3">
                      <div className="text-green-400 text-sm font-medium">
                        ✅ Setup completed successfully!
                      </div>
                      
                      {setupResults.results.tablesCreated.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-1">Tables Created:</h4>
                          <ul className="text-xs text-gray-400 list-disc pl-5">
                            {setupResults.results.tablesCreated.map((table: string, index: number) => (
                              <li key={index}>{table}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {setupResults.results.usersAdded.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-1">Users/Data Added:</h4>
                          <ul className="text-xs text-gray-400 list-disc pl-5">
                            {setupResults.results.usersAdded.map((user: string, index: number) => (
                              <li key={index}>{user}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {setupResults.results.errors.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-red-400 mb-1">Errors:</h4>
                          <ul className="text-xs text-red-300 list-disc pl-5">
                            {setupResults.results.errors.map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-400 text-sm">
                      ❌ Setup failed: {setupResults.error}
                    </div>
                  )}
                </div>
              )}

              {/* Environment Check */}
              <div className="bg-[#262d40] p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">4. Environment Check</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Supabase URL:</span>
                    <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-400' : 'text-red-400'}>
                      {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Supabase Anon Key:</span>
                    <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-400' : 'text-red-400'}>
                      {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                    </span>
                  </div>
                </div>
                
                {(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && (
                  <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded">
                    <p className="text-xs text-red-300">
                      <strong>Missing Environment Variables:</strong> Make sure you have a <code>.env.local</code> file 
                      with your Supabase credentials. Check the README.md for setup instructions.
                    </p>
                  </div>
                )}
              </div>

              {/* Troubleshooting */}
              <div className="bg-[#262d40] p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">5. Common Issues & Solutions</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <h3 className="font-medium text-yellow-400">🔑 "Invalid login credentials"</h3>
                    <ul className="text-xs text-gray-300 list-disc pl-5 mt-1 space-y-1">
                      <li>Make sure you're using the correct email and password</li>
                      <li>Check if the user exists in Supabase Auth dashboard</li>
                      <li>Try using the test accounts provided above</li>
                      <li>Enable debug mode in the login form for more details</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-yellow-400">📧 "Email not confirmed"</h3>
                    <ul className="text-xs text-gray-300 list-disc pl-5 mt-1 space-y-1">
                      <li>Check your email spam folder</li>
                      <li>Use the test accounts which are pre-verified</li>
                      <li>In Supabase dashboard, manually confirm the user's email</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-yellow-400">🏢 "Not assigned to any team"</h3>
                    <ul className="text-xs text-gray-300 list-disc pl-5 mt-1 space-y-1">
                      <li>Run the database setup to create test teams</li>
                      <li>Add the user to a team in the database</li>
                      <li>Make sure the user is in aditi_team_members table</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 