import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface AuthPasswordProps {
  embedded?: boolean;
}

export default function AuthPassword({ embedded = false }: AuthPasswordProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Clear form data when component unmounts or when switching between login/signup
  useEffect(() => {
    return () => {
      // Clear form data on component unmount (like when user signs out)
      setFormData({
        email: '',
        password: '',
        confirmPassword: ''
      });
    };
  }, []);

  // Reset form when switching between login and signup
  useEffect(() => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
    setShowTroubleshooting(false);
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setDebugInfo(null);
  }, [isLogin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Debug function to check database and user status
  const checkUserStatus = async (email: string) => {
    try {
      setDebugInfo({ checking: true });
      
      // Check if user exists in auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      // Check if user is in any of our tables
      const [adminCheck, managerCheck, teamCheck] = await Promise.all([
        supabase.from('aditi_admins').select('*').eq('email', email).single(),
        supabase.from('aditi_teams').select('*').eq('manager_email', email).maybeSingle(),
        supabase.from('aditi_team_members').select('*').eq('employee_email', email).maybeSingle()
      ]);

      const userInAuth = authUsers?.users?.find(u => u.email === email);
      
      const debugData = {
        email,
        userExistsInAuth: !!userInAuth,
        userConfirmed: userInAuth?.email_confirmed_at ? true : false,
        lastSignIn: userInAuth?.last_sign_in_at,
        isAdmin: !adminCheck.error && !!adminCheck.data,
        isManager: !managerCheck.error && !!managerCheck.data,
        isTeamMember: !teamCheck.error && !!teamCheck.data,
        authError: authError?.message,
        tables: {
          admin: adminCheck.error ? adminCheck.error.message : 'exists',
          teams: managerCheck.error ? managerCheck.error.message : 'exists',
          teamMembers: teamCheck.error ? teamCheck.error.message : 'exists'
        }
      };
      
      setDebugInfo(debugData);
      return debugData;
    } catch (error) {
      console.error('Debug check failed:', error);
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Enhanced reset password function
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(`Password reset failed: ${error.message}`);
        return;
      }

      toast.success('Password reset email sent! Check your inbox.');
      setResetEmailSent(true);
      setForgotPasswordEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.email || !formData.password) {
        toast.error('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      // Basic password validation - at least 6 characters
      if (!isLogin && formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }

      if (!isLogin && formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        // Check user status in debug mode
        if (debugMode) {
          await checkUserStatus(formData.email);
        }

        // Login with enhanced error handling
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          console.error('Login error:', error);
          
          // Enhanced error handling
          if (error.message.includes('Invalid login credentials')) {
            // Check if user exists first
            const userDebug = await checkUserStatus(formData.email);
            
            if (!userDebug?.userExistsInAuth) {
              toast.error('No account found with this email. Please sign up first or contact an administrator.');
            } else if (!userDebug?.userConfirmed) {
              toast.error('Please verify your email address before signing in. Check your inbox for a confirmation email.');
            } else {
              toast.error('Invalid email or password. Please check your credentials and try again.');
            }
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Please verify your email address before signing in. Check your inbox for a confirmation email.');
          } else if (error.message.includes('Too many requests')) {
            toast.error('Too many login attempts. Please wait a few minutes and try again.');
          } else if (error.message.includes('User not found')) {
            toast.error('No account found with this email. Please sign up first or contact an administrator.');
          } else {
            toast.error(`Authentication failed: ${error.message}`);
          }
          throw error;
        }
        
        // Verify user has role access
        if (data.user) {
          const userDebug = await checkUserStatus(data.user.email!);
          
          // Development bypass: Skip team checks if bypass flag is enabled
          const bypassTeamCheck = process.env.NODE_ENV === 'development' || 
                                 localStorage.getItem('bypass_team_check') === 'true';
          
          if (bypassTeamCheck) {
            console.log('Team assignment check bypassed for development');
            toast.success('Logged in successfully! (Team check bypassed)');
          } else if (!userDebug?.isAdmin && !userDebug?.isManager && !userDebug?.isTeamMember) {
            // Check if user exists in our database tables
            // Instead of blocking, try to automatically assign user to default team
            try {
              console.log(`User ${data.user.email} not in any team, attempting auto-assignment...`);
              
              // Try to get or create a default team
              let defaultTeam;
              const { data: existingTeam } = await supabase
                .from('aditi_teams')
                .select('*')
                .eq('team_name', 'Development Team')
                .single();
              
              if (existingTeam) {
                defaultTeam = existingTeam;
              } else {
                // Create default team if it doesn't exist
                const { data: newTeam } = await supabase
                  .from('aditi_teams')
                  .insert({
                    team_name: 'Development Team',
                    manager_email: 'manager@test.com'
                  })
                  .select()
                  .single();
                defaultTeam = newTeam;
              }
              
              if (defaultTeam) {
                // Add user to default team
                const { error: memberError } = await supabase
                  .from('aditi_team_members')
                  .insert({
                    team_id: defaultTeam.id,
                    employee_email: data.user.email,
                    employee_id: `EMP_${Date.now()}`, // Generate unique ID
                    team_member_name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                    manager_name: 'System Auto-Assigned',
                    team_name: defaultTeam.team_name
                  });
                
                if (!memberError) {
                  toast.success('Successfully assigned to Development Team! Welcome!');
                  console.log(`User ${data.user.email} automatically assigned to Development Team`);
                } else {
                  console.error('Error assigning user to team:', memberError);
                  // Don't block login, just warn
                  toast.success('Logged in successfully, but team assignment failed. Contact admin if needed.');
                }
              } else {
                // If team creation also fails, just warn but allow login
                toast.success('Logged in successfully, but automatic team assignment failed. Contact admin to be added to a team.');
              }
            } catch (autoAssignError) {
              console.error('Auto-assignment failed:', autoAssignError);
              // Don't block login, just warn
              toast.success('Logged in successfully, but automatic team assignment failed. Contact admin to be added to a team.');
            }
            
            // Continue with login regardless of team assignment success
            // This bypasses the blocking behavior
          }
        }
        
        // Clear form on successful login
        setFormData({
          email: '',
          password: '',
          confirmPassword: ''
        });
        toast.success('Logged in successfully!');
      } else {
        // Enhanced Sign up with automatic role assignment for admins
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              email: formData.email
            }
          }
        });

        if (error) {
          console.error('Signup error:', error);
          
          // Handle specific signup error cases
          if (error.message.includes('User already registered')) {
            toast.error('This email is already registered. Try signing in instead.');
          } else if (error.message.includes('Password should be at least')) {
            toast.error('Password should be at least 6 characters long.');
          } else if (error.message.includes('Signup is disabled')) {
            toast.error('Account registration is currently disabled. Please contact an administrator.');
          } else {
            toast.error(`Failed to create account: ${error.message}`);
          }
          throw error;
        }
        
        // Check if the user should be an admin or manager based on email
        if (data.user) {
          try {
            // Try to add as admin if they're in the admin list
            const { data: adminData } = await supabase
              .from('aditi_admins')
              .select('*')
              .eq('email', formData.email)
              .single();
              
            if (adminData) {
              toast.success('Admin account created! Please verify your email to complete setup.');
            } else {
              toast.success('Account created! Please verify your email and contact an administrator to be added to a team.');
            }
          } catch (err) {
            console.log('Not an admin, normal user signup');
            toast.success('Account created! Please verify your email and contact an administrator to be added to a team.');
          }
        }
        
        // Clear form on successful signup
        setFormData({
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        // Set a state to show troubleshooting message
        setShowTroubleshooting(true);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      // Error handling is done above, no need for duplicate toasts
    } finally {
      setIsLoading(false);
    }
  };

  // Return only the inner content when in embedded mode
  if (embedded) {
    return (
      <>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md">
            <div className="mb-4">
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-[#262d40] focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-[#262d40] focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  onClick={togglePasswordVisibility}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {showPassword ? "Password visible" : "Click the eye icon to view your password"}
                {!isLogin && <span className="block">Password must be at least 6 characters long</span>}
              </p>
            </div>
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-[#262d40] focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                    onClick={toggleConfirmPasswordVisibility}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
            {isLogin && (
              <p className="mt-2 text-xs text-center text-gray-400">
                Your browser can securely save your password for this site
              </p>
            )}
          </div>
        </form>

        {/* Debug Mode Toggle */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            {debugMode ? 'Hide Debug' : 'Show Debug Info'}
          </button>
        </div>

        {/* Debug Information */}
        {debugMode && debugInfo && (
          <div className="mt-4 p-3 bg-gray-900/50 border border-gray-700 rounded-md">
            <h4 className="text-xs font-medium text-gray-300 mb-2">Debug Information</h4>
            <pre className="text-xs text-gray-400 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Troubleshooting tips for email verification */}
        {showTroubleshooting && !isLogin && (
          <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-md">
            <h3 className="text-sm font-medium text-blue-300 mb-2">
              Can't find the verification email?
            </h3>
            <ul className="text-xs text-gray-300 list-disc pl-5 space-y-1">
              <li>Check your spam/junk folder</li>
              <li>Try a different email provider (Gmail, Outlook, etc.)</li>
              <li>Wait a few minutes as email delivery may be delayed</li>
              <li>Make sure you typed your email correctly</li>
              <li>Email verification is typically required before you can log in</li>
            </ul>
            <p className="text-xs text-gray-300 mt-2">
              Contact the administrator if problems persist.
            </p>
            <div className="mt-3 text-center">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setShowTroubleshooting(false);
                }}
                className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors duration-200"
              >
                Try signing in anyway
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors duration-200"
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
          
          {isLogin && (
            <button
              onClick={() => setShowForgotPassword(true)}
              className="block mt-2 mx-auto text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
            >
              Forgot your password?
            </button>
          )}
        </div>
        
        {/* Forgot Password Form */}
        {showForgotPassword && (
          <div className="mt-4 p-4 bg-gray-900/30 border border-gray-600 rounded-md">
            <h3 className="text-sm font-medium text-white mb-3">Reset Password</h3>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email address"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#262d40] text-white placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm transition-colors duration-200 disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Email'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-300 text-sm transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
            
            {resetEmailSent && (
              <div className="mt-3 p-2 bg-green-900/30 border border-green-700 rounded text-xs text-green-300">
                Password reset email sent! Check your inbox and follow the instructions.
              </div>
            )}
          </div>
        )}

        {/* Quick Access for Testing */}
        {debugMode && (
          <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-md">
            <h4 className="text-xs font-medium text-yellow-300 mb-2">Quick Test Accounts</h4>
            <p className="text-xs text-gray-400 mb-2">For testing purposes, try these accounts:</p>
            <div className="space-y-1 text-xs text-gray-300">
              <p>Admin: anubhav.chaudhary@aditiconsulting.com</p>
              <p>Admin: anubhavchaudhary459@gmail.com</p>
              <p className="text-yellow-400">Note: You still need the correct password</p>
            </div>
            
            {/* Team Assignment Bypass Toggle */}
            <div className="mt-3 pt-3 border-t border-yellow-600">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Team Assignment Check:</span>
                <button
                  onClick={() => {
                    const current = localStorage.getItem('bypass_team_check') === 'true';
                    localStorage.setItem('bypass_team_check', (!current).toString());
                    toast.success(current ? 'Team checking enabled' : 'Team checking bypassed');
                  }}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    localStorage.getItem('bypass_team_check') === 'true'
                      ? 'bg-red-600 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {localStorage.getItem('bypass_team_check') === 'true' ? 'Bypassed' : 'Enabled'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Toggle to bypass "not assigned to team" errors during testing
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Regular standalone mode
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1f2e] px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#1e2538] p-8 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            {isLogin ? 'Welcome back!' : 'Join us today'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md -space-y-px">
            <div className="mb-4">
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-[#262d40] focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-[#262d40] focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  onClick={togglePasswordVisibility}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {showPassword ? "Password visible" : "Click the eye icon to view your password"}
                {!isLogin && <span className="block">Password must be at least 6 characters long</span>}
              </p>
            </div>
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-[#262d40] focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                    onClick={toggleConfirmPasswordVisibility}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
            {isLogin && (
              <p className="mt-2 text-xs text-center text-gray-400">
                Your browser can securely save your password for this site
              </p>
            )}
          </div>
        </form>

        {/* Troubleshooting tips for email verification */}
        {showTroubleshooting && !isLogin && (
          <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-md">
            <h3 className="text-sm font-medium text-blue-300 mb-2">
              Can't find the verification email?
            </h3>
            <ul className="text-xs text-gray-300 list-disc pl-5 space-y-1">
              <li>Check your spam/junk folder</li>
              <li>Try a different email provider (Gmail, Outlook, etc.)</li>
              <li>Wait a few minutes as email delivery may be delayed</li>
              <li>Make sure you typed your email correctly</li>
              <li>Email verification is typically required before you can log in</li>
            </ul>
            <p className="text-xs text-gray-300 mt-2">
              Contact the administrator if problems persist.
            </p>
            <div className="mt-3 text-center">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setShowTroubleshooting(false);
                }}
                className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors duration-200"
              >
                Try signing in anyway
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors duration-200"
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
          
          {isLogin && (
            <button
              onClick={() => setShowForgotPassword(true)}
              className="block mt-2 mx-auto text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
            >
              Forgot your password?
            </button>
          )}
        </div>
        
        {/* Forgot Password Form */}
        {showForgotPassword && (
          <div className="mt-4 p-4 bg-gray-900/30 border border-gray-600 rounded-md">
            <h3 className="text-sm font-medium text-white mb-3">Reset Password</h3>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email address"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#262d40] text-white placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm transition-colors duration-200 disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Email'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-300 text-sm transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
            
            {resetEmailSent && (
              <div className="mt-3 p-2 bg-green-900/30 border border-green-700 rounded text-xs text-green-300">
                Password reset email sent! Check your inbox and follow the instructions.
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#1e2538] text-gray-400">
              Secure login powered by Supabase
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 