import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AuthSelector from '../components/AuthSelector';
import { useAuth } from '../lib/authContext';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [showFallbackUI, setShowFallbackUI] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    // Reduce timeout to 2 seconds for better UX
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Loading timeout reached, showing fallback UI');
        setShowFallbackUI(true);
      }
    }, 2000);

    // Enhanced user authentication and redirection logic
    if (user && !isLoading && !redirectAttempted) {
      console.log('🔄 Redirecting authenticated user:', user.email, 'Role:', user.role);
      setRedirectAttempted(true);
      
      switch (user.role) {
        case 'admin':
        case 'manager':
          router.push('/dashboard');
          break;
        case 'user':
          router.push('/user-dashboard');
          break;
        default:
          console.warn('⚠️ Unknown user role:', user.role);
          router.push('/user-dashboard'); // Default fallback
          break;
      }
    }

    return () => clearTimeout(loadingTimeout);
  }, [user, isLoading, router, redirectAttempted]);

  // Reset redirect attempt when user changes (for re-login scenarios)
  useEffect(() => {
    if (!user) {
      setRedirectAttempted(false);
    }
  }, [user]);

  // Show loading spinner with reduced timeout
  if (isLoading && !showFallbackUI) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1f2e]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if user is not authenticated or loading timed out
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* SEO Meta Tags */}
        <title>Login | Aditi Daily Updates System</title>
        <meta name="description" content="Official Aditi employee daily update portal login. Access your daily work progress tracking and team management system." />
        <meta name="keywords" content="Aditi login, Aditi employee portal, Aditi task management, Aditi daily updates login" />
        <meta name="author" content="Aditi" />
        
        {/* Open Graph Meta Tags for Social Media */}
        <meta property="og:title" content="Aditi Daily Employee Updates - Login" />
        <meta property="og:description" content="Secure login to Aditi employee task tracking and management system" />
        <meta property="og:image" content="/aditi.png" />
        <meta property="og:url" content="https://aditi-daily-updates.netlify.app/" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Aditi Daily Employee Updates - Login" />
        <meta name="twitter:description" content="Streamline your daily employee updates and task management" />
        <meta name="twitter:image" content="/aditi.png" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://aditi-daily-updates.netlify.app/" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      
      {user ? (
        <div className="min-h-screen flex items-center justify-center bg-[#1a1f2e] text-white">
          <div className="text-center p-8 bg-[#1e2538] rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
            <p className="mb-4">Welcome back, {user.name}!</p>
            <p className="text-sm text-gray-300 mb-4">If you are not redirected automatically, please click one of the following links:</p>
            <div className="mt-4 space-y-2">
              <button 
                onClick={() => router.push('/dashboard')}
                className="block w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Dashboard
              </button>
              <button 
                onClick={() => router.push('/user-dashboard')}
                className="block w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                User Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
        <AuthSelector />
      )}
    </>
  );
}
