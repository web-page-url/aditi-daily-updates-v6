import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { saveTabState } from './tabSwitchUtil';

// User cache key for localStorage
export const USER_CACHE_KEY = 'aditi_user_cache';

export type UserRole = 'user' | 'manager' | 'admin';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamId?: string;
  teamName?: string;
  lastChecked?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  checkUserRole: () => Promise<UserRole>;
  refreshUser: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
  checkUserRole: async () => 'user',
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Attempt to restore user from cache on initial load
  useEffect(() => {
    // Attempt to get cached user first for immediate UI display
    const cachedUser = localStorage.getItem(USER_CACHE_KEY);
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (err) {
        console.error('Error parsing cached user:', err);
      }
    } 
    
    // Check session in the background without showing loading state
    checkSessionQuietly();
    
    // Always force clear loading state after 3 seconds no matter what
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.log('SAFETY: Force clearing loading state');
        setIsLoading(false);
      }
    }, 3000);
    
    return () => clearTimeout(safetyTimer);
  }, []);

  // Handle tab visibility changes to prevent session loss
  useEffect(() => {
    // Define handler to maintain session when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Save tab state with authentication info
        saveTabState({ 
          hasAuth: !!user,
          authTimestamp: Date.now(),
          userEmail: user?.email
        });
        // Check if we have a cached user but not a current user state
        const cachedUser = localStorage.getItem(USER_CACHE_KEY);
        if (cachedUser && !user) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch (err) {
            console.error('Error parsing cached user:', err);
          }
        }
        // Always check session when tab becomes visible
        const tabSwitchDelay = setTimeout(() => {
          checkSessionQuietly();
        }, 500);
        return () => clearTimeout(tabSwitchDelay);
      } else if (document.visibilityState === 'hidden') {
        if (user) {
          saveTabState({ 
            hasAuth: true,
            hiddenWithAuth: true,
            userEmail: user.email
          });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          await updateUserData(session.user);
        } catch (error) {
          console.error('Error updating user data on sign in:', error);
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem(USER_CACHE_KEY);
        
        if (router.pathname !== '/') {
          router.push('/');
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [router.pathname]);
  
  // Quiet session check without loading spinner
  const checkSessionQuietly = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session check error:', error);
        setUser(null);
        localStorage.removeItem(USER_CACHE_KEY);
        return;
      }
      if (session && session.user) {
        updateUserData(session.user, false);
      } else if (!session && user) {
        const cachedUser = localStorage.getItem(USER_CACHE_KEY);
        if (!cachedUser) {
          setUser(null);
          localStorage.removeItem(USER_CACHE_KEY);
        } else if (document.visibilityState !== 'visible') {
          console.log('Preserving user during tab switch');
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  // Update user data from Supabase user
  const updateUserData = async (authUser: any, showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      if (!authUser?.email) {
        setUser(null);
        return;
      }
      
      // Get user role
      let role: UserRole = 'user';
      
      try {
        // Check if admin
        const { data: adminData } = await supabase
          .from('aditi_admins')
          .select('*')
          .eq('email', authUser.email)
          .single();
        
        if (adminData) {
          role = 'admin';
        } else {
          // Check if manager
          const { data: managerData } = await supabase
            .from('aditi_teams')
            .select('*')
            .eq('manager_email', authUser.email);
          
          if (managerData && managerData.length > 0) {
            role = 'manager';
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
      
      // Get team info
      let teamId = undefined;
      let teamName = undefined;
      
      try {
        const { data: userData } = await supabase
          .from('aditi_team_members')
          .select('*, aditi_teams(*)')
          .eq('employee_email', authUser.email)
          .single();
        
        if (userData) {
          teamId = userData.team_id;
          teamName = userData.aditi_teams?.team_name;
        }
      } catch (error) {
        console.error('Error getting user team info:', error);
      }
      
      // Create user object
      const updatedUser = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email.split('@')[0] || 'User',
        role,
        teamId,
        teamName,
        lastChecked: Date.now()
      };
      
      // Update state and cache
      setUser(updatedUser);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
      
    } catch (error) {
      console.error('Error updating user data:', error);
      setUser(null);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        setUser(null);
        return;
      }
      
      if (authUser) {
        await updateUserData(authUser);
      } else {
        setUser(null);
        localStorage.removeItem(USER_CACHE_KEY);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserRole = async (): Promise<UserRole> => {
    // First try to get from current user
    if (user?.role) {
      return user.role;
    }
    
    // Try to refresh the user first
    try {
      await refreshUser();
      if (user?.role) {
        return user.role;
      }
    } catch (error) {
      console.error('Error during refresh for role check:', error);
    }
    
    // Default to user role if we can't determine
    return 'user';
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 Starting AGGRESSIVE cache clearing and sign out process...');
      
      // Clear user state immediately to prevent UI confusion
      setUser(null);
      
      // STEP 1: AGGRESSIVE LOCALSTORAGE CLEARING
      console.log('🧹 STEP 1: Aggressively clearing localStorage...');
      
      // First, clear our specific keys
      const ourSpecificKeys = [
        USER_CACHE_KEY,
        'aditi_supabase_auth',
        'aditi_tab_state',
        'bypass_team_check'
      ];
      
      ourSpecificKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`✅ Removed: ${key}`);
      });
      
      // Then, clear ALL keys that might be related to authentication
      const allKeys = Object.keys(localStorage);
      console.log(`🔍 Found ${allKeys.length} localStorage keys, checking each...`);
      
      allKeys.forEach(key => {
        // Remove any key that looks like it could be auth-related
        if (
          key.startsWith('sb-') ||           // Supabase keys
          key.startsWith('supabase') ||      // Any supabase variants
          key.includes('auth') ||            // Any auth-related
          key.includes('session') ||         // Session data
          key.includes('token') ||           // Token data
          key.includes('user') ||            // User data
          key.includes('aditi') ||           // Our app data
          key.includes('login') ||           // Login data
          key.includes('password') ||        // Password data
          key.includes('cache') ||           // Any cache
          key.includes('state')              // State data
        ) {
          localStorage.removeItem(key);
          console.log(`🗑️ Aggressively removed: ${key}`);
        }
      });
      
      // STEP 2: AGGRESSIVE SESSIONSTORAGE CLEARING
      console.log('🧹 STEP 2: Aggressively clearing sessionStorage...');
      
      // Clear our specific session keys
      const sessionKeys = [
        'aditi_tab_id',
        'returning_from_tab_switch',
        'prevent_auto_refresh'
      ];
      
      sessionKeys.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`✅ Removed session: ${key}`);
      });
      
      // Clear ALL session storage keys that might be auth-related
      const allSessionKeys = Object.keys(sessionStorage);
      console.log(`🔍 Found ${allSessionKeys.length} sessionStorage keys, checking each...`);
      
      allSessionKeys.forEach(key => {
        if (
          key.startsWith('sb-') ||
          key.startsWith('supabase') ||
          key.includes('auth') ||
          key.includes('session') ||
          key.includes('token') ||
          key.includes('user') ||
          key.includes('aditi') ||
          key.includes('login') ||
          key.includes('cache') ||
          key.includes('state')
        ) {
          sessionStorage.removeItem(key);
          console.log(`🗑️ Aggressively removed session: ${key}`);
        }
      });
      
      // STEP 3: AGGRESSIVE BROWSER CACHE CLEARING (where possible)
      console.log('🧹 STEP 3: Attempting browser cache clearing...');
      
      try {
        // Clear any cached responses if available
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          console.log(`🔍 Found ${cacheNames.length} cache stores...`);
          
          await Promise.all(
            cacheNames.map(async (cacheName) => {
              await caches.delete(cacheName);
              console.log(`🗑️ Deleted cache: ${cacheName}`);
            })
          );
        }
      } catch (cacheError) {
        console.log('ℹ️ Browser cache clearing not available or failed:', (cacheError as Error).message);
      }
      
      // STEP 4: CLEAR INDEXEDDB (where possible)
      console.log('🧹 STEP 4: Attempting IndexedDB clearing...');
      
      try {
        if ('indexedDB' in window) {
          // Get all databases (this might not work in all browsers)
          const databases = await indexedDB.databases?.() || [];
          
          for (const db of databases) {
            if (db.name && (
              db.name.includes('supabase') ||
              db.name.includes('auth') ||
              db.name.includes('aditi')
            )) {
              const deleteReq = indexedDB.deleteDatabase(db.name);
              deleteReq.onsuccess = () => console.log(`🗑️ Deleted IndexedDB: ${db.name}`);
              deleteReq.onerror = () => console.log(`❌ Failed to delete IndexedDB: ${db.name}`);
            }
          }
        }
      } catch (idbError) {
        console.log('ℹ️ IndexedDB clearing not available or failed:', (idbError as Error).message);
      }
      
      // STEP 5: MEMORY CLEANUP
      console.log('🧹 STEP 5: Memory and object cleanup...');
      
      // Force garbage collection hint (if available)
      if (window.gc) {
        window.gc();
        console.log('🗑️ Forced garbage collection');
      }
      
      console.log('✅ Completed aggressive local cleanup');
      
      // STEP 6: SUPABASE SIGNOUT (Multiple attempts)
      console.log('🧹 STEP 6: Aggressive Supabase signout...');
      
      // First attempt - global signout
      try {
        const { error: globalError } = await supabase.auth.signOut({ scope: 'global' });
        if (globalError) {
          console.error('Global signout error:', globalError);
        } else {
          console.log('✅ Global Supabase signout successful');
        }
      } catch (globalErr) {
        console.error('Global signout failed:', globalErr);
      }
      
      // Second attempt - local signout
      try {
        const { error: localError } = await supabase.auth.signOut({ scope: 'local' });
        if (localError) {
          console.error('Local signout error:', localError);
        } else {
          console.log('✅ Local Supabase signout successful');
        }
      } catch (localErr) {
        console.error('Local signout failed:', localErr);
      }
      
      // Third attempt - force clear session
      try {
        await supabase.auth.signOut();
        console.log('✅ Default Supabase signout successful');
      } catch (defaultErr) {
        console.error('Default signout failed:', defaultErr);
      }
      
      // STEP 7: FINAL VERIFICATION AND CLEANUP
      console.log('🧹 STEP 7: Final verification...');
      
      // Verify session is actually cleared
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.warn('⚠️ Session still exists after signout attempts!');
          // Try one more time
          await supabase.auth.signOut({ scope: 'global' });
        } else {
          console.log('✅ Session successfully cleared');
        }
      } catch (sessionCheck) {
        console.log('ℹ️ Session check failed (which is good - means no session)');
      }
      
      // STEP 8: FINAL STORAGE RE-CHECK
      console.log('🧹 STEP 8: Final storage verification...');
      
      // Double-check that our critical keys are really gone
      const criticalKeys = [USER_CACHE_KEY, 'aditi_supabase_auth'];
      criticalKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`🔥 Force-removed stubborn key: ${key}`);
        }
      });
      
      toast.success('Signed out successfully with aggressive cleanup');
      
      // Force redirect to home page
      if (router.pathname !== '/') {
        await router.push('/');
      }
      
      console.log('🎉 AGGRESSIVE sign out process completed');
      
      // STEP 9: NUCLEAR OPTION - FORCE RELOAD
      console.log('🧹 STEP 9: Nuclear option - forcing page reload...');
      
      // Force page reload after a short delay to ensure completely clean state
      setTimeout(() => {
        console.log('💥 NUCLEAR: Forcing complete page reload for absolute clean state');
        // Use location.replace instead of location.href to avoid back button issues
        window.location.replace('/');
      }, 500);
      
    } catch (error) {
      console.error('❌ Error during aggressive signout:', error);
      
      // EMERGENCY NUCLEAR CLEANUP
      console.log('🚨 EMERGENCY: Performing nuclear cleanup...');
      
      // Clear user state
      setUser(null);
      
      // Nuclear localStorage clearing - remove EVERYTHING that could be ours
      try {
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
          if (key.includes('aditi') || key.includes('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
        console.log('💥 Emergency localStorage nuclear cleanup completed');
      } catch (clearError) {
        console.error('💥 Even nuclear cleanup failed:', clearError);
        // Last resort - try to clear everything (dangerous but necessary)
        try {
          localStorage.clear();
          sessionStorage.clear();
          console.log('💥 ULTIMATE NUCLEAR: Cleared ALL storage');
        } catch (ultimateError) {
          console.error('💥 Ultimate nuclear cleanup failed:', ultimateError);
        }
      }
      
      toast.success('Emergency signout completed');
      
      if (router.pathname !== '/') {
        router.push('/');
      }
      
      // Nuclear reload even on error
      setTimeout(() => {
        window.location.replace('/');
      }, 1000);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        isLoading,
        signOut,
        checkUserRole,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 