import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { saveTabState } from './tabSwitchUtil';

// User cache keys for localStorage
export const USER_CACHE_KEY = 'aditi_user_cache';
export const SESSION_BACKUP_KEY = 'aditi_session_backup';
export const SESSION_LOCK_KEY = 'aditi_session_lock';

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
  const [sessionCheckInProgress, setSessionCheckInProgress] = useState(false);
  const [lastSessionCheck, setLastSessionCheck] = useState<number>(0);
  const router = useRouter();

  // Enhanced user state setter with comprehensive backup
  const setUserWithBackup = (newUser: User | null) => {
    console.log('🔄 Setting user with backup:', newUser?.email || 'null');
    setUser(newUser);
    
    // Guard against SSR
    if (typeof window === 'undefined') return;
    
    if (newUser) {
      try {
        // Store in multiple places for redundancy
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(newUser));
        
        // Create a session backup with timestamp and session ID
        const sessionBackup = {
          user: newUser,
          timestamp: Date.now(),
          sessionId: `session_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          tabId: sessionStorage.getItem('aditi_tab_id') || 'unknown',
          url: window.location.href,
          lastActivity: Date.now(), // Track last activity for refresh scenarios
          refreshCount: parseInt(sessionStorage.getItem('aditi_refresh_count') || '0') + 1
        };
        localStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify(sessionBackup));
        
        // Also store in sessionStorage for immediate tab recovery
        sessionStorage.setItem('aditi_current_user', JSON.stringify(newUser));
        
        // Track refresh count for debugging
        sessionStorage.setItem('aditi_refresh_count', sessionBackup.refreshCount.toString());
        
        // Store a "last known good state" marker
        localStorage.setItem('aditi_last_good_state', JSON.stringify({
          timestamp: Date.now(),
          userEmail: newUser.email,
          userRole: newUser.role
        }));
      } catch (error) {
        console.error('❌ Error saving user backup (storage quota exceeded?):', error);
        // Continue without backup if storage fails
      }
      
    } else {
      try {
        localStorage.removeItem(USER_CACHE_KEY);
        localStorage.removeItem(SESSION_BACKUP_KEY);
        localStorage.removeItem('aditi_last_good_state');
        sessionStorage.removeItem('aditi_current_user');
        sessionStorage.removeItem('aditi_refresh_count');
      } catch (error) {
        console.error('❌ Error clearing user backup:', error);
      }
    }
  };

  // Enhanced user restoration with multiple fallback sources
  const restoreUserFromBackup = (): User | null => {
    // Guard against SSR
    if (typeof window === 'undefined') return null;
    
    try {
      // First try sessionStorage (most recent)
      const sessionUser = sessionStorage.getItem('aditi_current_user');
      if (sessionUser) {
        const parsedUser = JSON.parse(sessionUser);
        console.log('✅ Restored user from sessionStorage:', parsedUser.email);
        setUser(parsedUser);
        return parsedUser;
      }

      // Then try session backup (with timestamp validation)
      const sessionBackup = localStorage.getItem(SESSION_BACKUP_KEY);
      if (sessionBackup) {
        const backup = JSON.parse(sessionBackup);
        // Check if backup is recent (within 24 hours)
        if (backup.timestamp && (Date.now() - backup.timestamp) < 24 * 60 * 60 * 1000) {
          console.log('✅ Restored user from session backup:', backup.user.email);
          setUser(backup.user);
          // Also update sessionStorage
          sessionStorage.setItem('aditi_current_user', JSON.stringify(backup.user));
          return backup.user;
        }
      }
      
      // Finally try regular cache
      const cachedUser = localStorage.getItem(USER_CACHE_KEY);
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        console.log('✅ Restored user from cache:', parsedUser.email);
        setUser(parsedUser);
        // Update sessionStorage
        sessionStorage.setItem('aditi_current_user', JSON.stringify(parsedUser));
        return parsedUser;
      }
    } catch (err) {
      console.error('❌ Error restoring user from backup:', err);
    }
    return null;
  };

  // Session lock mechanism to prevent race conditions
  const acquireSessionLock = (): boolean => {
    // Guard against SSR
    if (typeof window === 'undefined') return false;
    
    const lockKey = SESSION_LOCK_KEY;
    const currentTime = Date.now();
    const existingLock = localStorage.getItem(lockKey);
    
    if (existingLock) {
      const lockTime = parseInt(existingLock);
      // If lock is older than 10 seconds, consider it stale
      if (currentTime - lockTime < 10000) {
        return false; // Lock is active
      }
    }
    
    // Acquire lock
    localStorage.setItem(lockKey, currentTime.toString());
    return true;
  };

  const releaseSessionLock = () => {
    // Guard against SSR
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_LOCK_KEY);
  };

  // Initial load effect with immediate restoration
  useEffect(() => {
    // Guard against SSR - only run in browser
    if (typeof window === 'undefined') return;
    
    console.log('🚀 AuthProvider initializing...');
    
    // CRITICAL: Check if this is a page refresh scenario (browser-only)
    let isPageRefresh = false;
    try {
      isPageRefresh = (typeof window !== 'undefined' && 
                       window.performance?.getEntriesByType && 
                       window.performance.getEntriesByType('navigation').length > 0 && 
                       (window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).type === 'reload') ||
                      (typeof window !== 'undefined' && window.performance?.navigation?.type === 1);
    } catch (error) {
      console.log('⚠️ Performance API not available, assuming normal load');
      isPageRefresh = false;
    }
    
    if (isPageRefresh) {
      console.log('🔄 Page refresh detected, prioritizing localStorage recovery...');
    }
    
    // Immediately restore from backup to prevent UI flicker
    const restoredUser = restoreUserFromBackup();
    
    // If we restored a user, we can clear loading immediately
    if (restoredUser) {
      console.log('✅ User restored immediately:', restoredUser.email);
      setIsLoading(false);
      
      // For page refresh scenarios, also verify the session is still valid
      if (isPageRefresh) {
        console.log('🔍 Verifying session after page refresh...');
        setTimeout(() => {
          if (!sessionCheckInProgress) {
            checkSessionQuietly();
          }
        }, 500); // Slightly longer delay for refresh scenarios
      }
    } else {
      console.log('⚠️ No user found in backup, checking session...');
    }
    
    // Check session in the background (with delay to avoid race conditions)
    if (!restoredUser || !isPageRefresh) {
      const sessionCheckDelay = setTimeout(() => {
        if (!sessionCheckInProgress) {
          checkSessionQuietly();
        }
      }, 100);
      
      return () => {
        clearTimeout(sessionCheckDelay);
      };
    }
    
    // Safety timer to clear loading state
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.log('⚠️ SAFETY: Force clearing loading state');
        setIsLoading(false);
      }
    }, 3000);
    
    return () => {
      clearTimeout(safetyTimer);
    };
  }, []);

  // Enhanced tab visibility handler with better session management
  useEffect(() => {
    // Guard against SSR - only run in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab became visible, managing session...');
        
        // Save current state
        saveTabState({ 
          hasAuth: !!user,
          authTimestamp: Date.now(),
          userEmail: user?.email,
          tabBecameVisible: true,
          currentUrl: window.location.href
        });
        
        // If we don't have a user but have a backup, restore it immediately
        if (!user) {
          const restoredUser = restoreUserFromBackup();
          if (restoredUser) {
            console.log('✅ Restored user from backup on tab focus:', restoredUser.email);
          }
        }
        
        // Check session with delay to avoid race conditions
        const checkDelay = setTimeout(() => {
          // Only check if enough time has passed since last check
          const timeSinceLastCheck = Date.now() - lastSessionCheck;
          if (timeSinceLastCheck > 5000 && !sessionCheckInProgress) { // 5 second minimum
            checkSessionQuietly();
          }
        }, 500);
        
        return () => clearTimeout(checkDelay);
        
      } else if (document.visibilityState === 'hidden') {
        // Save state when tab becomes hidden
        if (user) {
          console.log('👁️ Tab became hidden, saving state for:', user.email);
          saveTabState({ 
            hasAuth: true,
            hiddenWithAuth: true,
            userEmail: user.email,
            tabBecameHidden: true,
            currentUrl: window.location.href
          });
          
          // Ensure user is backed up before tab becomes hidden
          setUserWithBackup(user);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, sessionCheckInProgress, lastSessionCheck]);

  // Enhanced auth state listener with better error handling
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event, !!session);
      
      if (event === 'SIGNED_IN' && session) {
        try {
          await updateUserData(session.user);
        } catch (error) {
          console.error('❌ Error updating user data on sign in:', error);
          // Don't clear user on error, try to restore from backup
          if (!user) {
            restoreUserFromBackup();
          }
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out');
        setUserWithBackup(null);
        if (router.pathname !== '/') {
          router.push('/');
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('🔄 Token refreshed, updating user data');
        try {
          await updateUserData(session.user, false);
        } catch (error) {
          console.error('❌ Error updating user data on token refresh:', error);
          // Don't clear user on token refresh error
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [router.pathname]);
  
  // Enhanced quiet session check with lock mechanism
  const checkSessionQuietly = async () => {
    if (sessionCheckInProgress) {
      console.log('⏳ Session check already in progress, skipping...');
      return;
    }

    // Try to acquire lock
    if (!acquireSessionLock()) {
      console.log('🔒 Session check locked by another process, skipping...');
      return;
    }

    setSessionCheckInProgress(true);
    setLastSessionCheck(Date.now());
    
    try {
      console.log('🔍 Checking session quietly...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session check error:', error);
        // Don't immediately clear user on error, try to restore from backup
        if (!user) {
          restoreUserFromBackup();
        }
        return;
      }
      
      if (session && session.user) {
        console.log('✅ Valid session found, updating user data');
        await updateUserData(session.user, false);
      } else if (!session) {
        console.log('❌ No session found');
        
        // Check if we have a very recent backup before clearing user
        const sessionBackup = localStorage.getItem(SESSION_BACKUP_KEY);
        if (sessionBackup) {
          try {
            const backup = JSON.parse(sessionBackup);
            // If backup is very recent (within 2 minutes), keep the user
            if (backup.timestamp && (Date.now() - backup.timestamp) < 2 * 60 * 1000) {
              console.log('⏰ Keeping user from recent backup despite no session');
              if (!user && backup.user) {
                setUser(backup.user);
              }
              return;
            }
          } catch (err) {
            console.error('❌ Error parsing session backup:', err);
          }
        }
        
        // Only clear user if no recent backup and we're not on a protected route
        if (user && !sessionBackup && router.pathname !== '/') {
          console.log('🧹 Clearing user due to no session');
          setUserWithBackup(null);
        }
      }
    } catch (error) {
      console.error('❌ Error checking session:', error);
      // On error, try to restore from backup if we don't have a user
      if (!user) {
        restoreUserFromBackup();
      }
    } finally {
      setSessionCheckInProgress(false);
      releaseSessionLock();
    }
  };

  // Enhanced user data update with retry logic
  const updateUserData = async (authUser: any, showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      if (!authUser?.email) {
        setUserWithBackup(null);
        return;
      }
      
      // Get user role with retry logic
      let role: UserRole = 'user';
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          // Check if admin
          const { data: adminData } = await supabase
            .from('aditi_admins')
            .select('*')
            .eq('email', authUser.email)
            .single();
          
          if (adminData) {
            role = 'admin';
            break;
          } else {
            // Check if manager
            const { data: managerData } = await supabase
              .from('aditi_teams')
              .select('*')
              .eq('manager_email', authUser.email);
            
            if (managerData && managerData.length > 0) {
              role = 'manager';
            }
            break;
          }
        } catch (error) {
          retryCount++;
          console.error(`❌ Error checking user role (attempt ${retryCount}):`, error);
          if (retryCount >= maxRetries) {
            console.log('⚠️ Max retries reached, using default role');
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }
      
      // Get team info with retry logic
      let teamId = undefined;
      let teamName = undefined;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
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
          break;
        } catch (error) {
          retryCount++;
          console.error(`❌ Error getting user team info (attempt ${retryCount}):`, error);
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
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
      
      // Update state with backup
      setUserWithBackup(updatedUser);
      console.log('✅ User data updated successfully:', updatedUser.email, updatedUser.role);
      
    } catch (error) {
      console.error('❌ Error updating user data:', error);
      // Don't clear user on error, try to restore from backup
      if (!user) {
        restoreUserFromBackup();
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const refreshUser = async () => {
    if (sessionCheckInProgress) {
      console.log('⏳ Session check in progress, skipping refresh');
      return;
    }

    try {
      setIsLoading(true);
      setSessionCheckInProgress(true);
      
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Error getting user:', error);
        // Try to restore from backup instead of clearing
        if (!user) {
          restoreUserFromBackup();
        }
        return;
      }
      
      if (authUser) {
        await updateUserData(authUser);
      } else {
        // Only clear if no backup available
        const backup = restoreUserFromBackup();
        if (!backup) {
          setUserWithBackup(null);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
      // Try to restore from backup
      if (!user) {
        restoreUserFromBackup();
      }
    } finally {
      setIsLoading(false);
      setSessionCheckInProgress(false);
    }
  };

  const checkUserRole = async (): Promise<UserRole> => {
    // First try to get from current user
    if (user?.role) {
      return user.role;
    }
    
    // Try to restore from backup
    const restoredUser = restoreUserFromBackup();
    if (restoredUser?.role) {
      return restoredUser.role;
    }
    
    // Try to refresh the user
    try {
      await refreshUser();
      if (user?.role) {
        return user.role;
      }
    } catch (error) {
      console.error('❌ Error during refresh for role check:', error);
    }
    
    // Default to user role if we can't determine
    return 'user';
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 Starting sign out process...');
      
      // Clear user state immediately
      setUserWithBackup(null);
      
      // Clear all localStorage data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('aditi_') || key.startsWith('dashboard_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear session storage
      sessionStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      console.log('✅ Sign out completed');
      
      // Redirect to home
      router.push('/');
      
    } catch (error) {
      console.error('❌ Error during sign out:', error);
      toast.error('Error signing out');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      signOut,
      checkUserRole,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 