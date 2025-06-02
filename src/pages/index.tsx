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
        {/* Enhanced Basic Meta Tags */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Enhanced SEO Meta Tags */}
        <title>Login | Aditi Daily Updates - Enterprise Task Management System</title>
        <meta name="description" content="Secure login to Aditi Daily Updates - the enterprise solution for daily task tracking, team management, and project collaboration. Access your team dashboard and manage daily progress efficiently." />
        <meta name="keywords" content="Aditi login, employee portal, task management login, daily updates, team collaboration, project tracking, enterprise software, productivity dashboard, team management system, Aditi Consulting login" />
        <meta name="author" content="Aditi Consulting" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        
        {/* Enhanced Open Graph Meta Tags for Social Media */}
        <meta property="og:title" content="Login | Aditi Daily Updates - Enterprise Task Management" />
        <meta property="og:description" content="Secure employee portal login for Aditi Daily Updates - streamline task tracking, team collaboration, and project management for your organization." />
        <meta property="og:image" content="/aditi.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Aditi Daily Updates Login Portal" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_SITE_URL || "https://aditi-daily-updates.vercel.app"} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Aditi Daily Updates System" />
        <meta property="og:locale" content="en_US" />
        
        {/* Enhanced Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AditiConsulting" />
        <meta name="twitter:creator" content="@AditiConsulting" />
        <meta name="twitter:title" content="Login | Aditi Daily Updates - Enterprise Task Management" />
        <meta name="twitter:description" content="Secure employee portal login for daily task tracking, team collaboration, and project management." />
        <meta name="twitter:image" content="/aditi.png" />
        <meta name="twitter:image:alt" content="Aditi Daily Updates Login Portal" />
        
        {/* Business/Professional Meta Tags */}
        <meta name="application-name" content="Aditi Daily Updates" />
        <meta name="apple-mobile-web-app-title" content="Aditi Updates Login" />
        <meta name="msapplication-tooltip" content="Login to Aditi Daily Updates System" />
        <meta name="rating" content="General" />
        <meta name="distribution" content="global" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || "https://aditi-daily-updates.vercel.app"} />
        
        {/* Preload Critical Resources */}
        <link rel="preload" href="/aditi.png" as="image" type="image/png" />
        
        {/* Enhanced Fonts with Performance Optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* Schema.org Structured Data for Login Page */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Login - Aditi Daily Updates System",
              "description": "Secure login portal for Aditi Daily Updates enterprise task management system",
              "url": process.env.NEXT_PUBLIC_SITE_URL || "https://aditi-daily-updates.vercel.app",
              "inLanguage": "en-US",
              "isPartOf": {
                "@type": "WebSite",
                "name": "Aditi Daily Updates System",
                "url": process.env.NEXT_PUBLIC_SITE_URL || "https://aditi-daily-updates.vercel.app"
              },
              "about": {
                "@type": "SoftwareApplication",
                "name": "Aditi Daily Updates System",
                "description": "Enterprise task management and daily progress tracking system",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser"
              },
              "provider": {
                "@type": "Organization",
                "name": "Aditi Consulting",
                "url": "https://aditiconsulting.com"
              },
              "potentialAction": {
                "@type": "LoginAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": process.env.NEXT_PUBLIC_SITE_URL || "https://aditi-daily-updates.vercel.app",
                  "actionPlatform": [
                    "http://schema.org/DesktopWebPlatform",
                    "http://schema.org/MobileWebPlatform"
                  ]
                }
              }
            })
          }}
        />
        
        {/* Additional Business Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Aditi Daily Updates System",
              "description": "Enterprise daily task tracking and team management platform",
              "url": process.env.NEXT_PUBLIC_SITE_URL || "https://aditi-daily-updates.vercel.app",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Cross-Platform",
              "permissions": "Requires account registration",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "http://schema.org/InStock"
              },
              "featureList": [
                "Secure user authentication",
                "Role-based access control", 
                "Daily task tracking",
                "Team collaboration",
                "Progress monitoring",
                "Export capabilities"
              ],
              "creator": {
                "@type": "Organization",
                "name": "Aditi Consulting"
              }
            })
          }}
        />
      </Head>
      
      {user ? (
        <main className="min-h-screen flex items-center justify-center bg-[#1a1f2e] text-white">
          <section className="text-center p-8 bg-[#1e2538] rounded-lg shadow-lg">
            <header>
              <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
              <p className="mb-4">Welcome back, <strong>{user.name}</strong>!</p>
            </header>
            <div className="redirect-options">
              <p className="text-sm text-gray-300 mb-4">If you are not redirected automatically, please click one of the following links:</p>
              <nav className="mt-4 space-y-2" role="navigation" aria-label="Dashboard navigation">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="block w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors duration-200"
                  aria-label="Go to Admin Dashboard"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => router.push('/user-dashboard')}
                  className="block w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors duration-200"
                  aria-label="Go to User Dashboard"
                >
                  User Dashboard
                </button>
              </nav>
            </div>
          </section>
        </main>
      ) : (
        <main className="min-h-screen">
          <AuthSelector />
        </main>
      )}
    </>
  );
}
