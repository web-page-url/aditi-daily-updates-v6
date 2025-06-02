import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import { AuthProvider } from "@/lib/authContext";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ensureTokenInRequests } from "@/lib/tabSwitchUtil";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  // Initialize token persistence for API requests
  useEffect(() => {
    // Ensure tokens are included in all API requests
    ensureTokenInRequests();
  }, []);

  // Route-specific handling
  useEffect(() => {
    // Check if current route is an admin/manager route
    const adminRouteCheck = () => {
      const isAdmin = router.pathname === '/dashboard' || 
                      router.pathname.includes('/team-management') || 
                      router.pathname.includes('/admin');
      setIsAdminRoute(isAdmin);
    };
    
    adminRouteCheck();
    router.events.on('routeChangeComplete', adminRouteCheck);
    
    return () => {
      router.events.off('routeChangeComplete', adminRouteCheck);
    };
  }, [router.pathname, router.events]);

  // Global loading state timeout handler
  useEffect(() => {
    // This adds a safety mechanism for all pages to prevent hanging loading states
    const html = document.documentElement;
    html.classList.add('js-loading');
    
    // Force remove loading class after timeout
    // Use shorter timeout for admin routes since they have their own handling
    const timeoutDuration = isAdminRoute ? 5000 : 8000;
    
    const globalTimeout = setTimeout(() => {
      html.classList.remove('js-loading');
      console.log(`Global loading safety timeout reached (${isAdminRoute ? 'admin route' : 'standard route'})`);
    }, timeoutDuration);
    
    // Listen for route change end and errors
    const handleRouteChangeComplete = () => {
      html.classList.remove('js-loading');
    };

    const handleRouteChangeError = () => {
      html.classList.remove('js-loading');
      console.log('Route change error - clearing loading state');
    };
    
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);
    
    return () => {
      clearTimeout(globalTimeout);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router, isAdminRoute]);

  return (
    <AuthProvider>
      <Head>
        {/* Enhanced Viewport and Mobile Optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
        
        {/* Enhanced Theme and App Configuration */}
        <meta name="theme-color" content="#1a1f2e" />
        <meta name="msapplication-navbutton-color" content="#1a1f2e" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Aditi Updates" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Aditi Daily Updates" />
        
        {/* Enhanced PWA and Mobile App Tags */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <meta name="mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Global SEO Defaults (can be overridden by individual pages) */}
        <meta name="description" content="Streamline your team's daily progress tracking with Aditi Daily Updates - the enterprise solution for task management, team collaboration, and project monitoring." />
        <meta name="keywords" content="task management, daily updates, team collaboration, project tracking, enterprise software, productivity tools, Aditi Consulting, team management, progress tracking, workflow optimization" />
        <meta name="author" content="Aditi Consulting" />
        <meta name="publisher" content="Aditi Consulting" />
        <meta name="copyright" content={`© ${new Date().getFullYear()} Aditi Consulting. All rights reserved.`} />
        
        {/* Open Graph Tags for Social Media */}
        <meta property="og:site_name" content="Aditi Daily Updates System" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:title" content="Aditi Daily Updates - Enterprise Task Management System" />
        <meta property="og:description" content="Streamline your team's daily progress tracking with our enterprise solution for task management, team collaboration, and project monitoring." />
        <meta property="og:image" content="/aditi.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Aditi Daily Updates System Dashboard" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_SITE_URL || "https://aditi-daily-updates.vercel.app"} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AditiConsulting" />
        <meta name="twitter:creator" content="@AditiConsulting" />
        <meta name="twitter:title" content="Aditi Daily Updates - Enterprise Task Management System" />
        <meta name="twitter:description" content="Streamline your team's daily progress tracking with our enterprise solution for task management and team collaboration." />
        <meta name="twitter:image" content="/aditi.png" />
        <meta name="twitter:image:alt" content="Aditi Daily Updates System Dashboard" />
        
        {/* LinkedIn and Professional Networks */}
        <meta property="linkedin:owner" content="aditi-consulting" />
        
        {/* Additional Business/Professional Meta Tags */}
        <meta name="rating" content="General" />
        <meta name="distribution" content="global" />
        <meta name="revisit-after" content="1 days" />
        <meta name="expires" content="never" />
        <meta name="language" content="English" />
        <meta name="geo.region" content="US" />
        <meta name="geo.placename" content="United States" />
        
        {/* Performance and Optimization */}
        <meta name="google" content="notranslate" />
        <meta httpEquiv="cache-control" content="public, max-age=31536000, immutable" />
        
        {/* Canonical URL (will be overridden by individual pages) */}
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || "https://aditi-daily-updates.vercel.app"} />
        
        {/* Alternative Language Links (if applicable) */}
        <link rel="alternate" hrefLang="en" href={process.env.NEXT_PUBLIC_SITE_URL || "https://aditi-daily-updates.vercel.app"} />
        <link rel="alternate" hrefLang="x-default" href={process.env.NEXT_PUBLIC_SITE_URL || "https://aditi-daily-updates.vercel.app"} />
      </Head>
      <Component {...pageProps} />
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1a1f2e',
          color: '#ffffff',
        },
        success: {
          duration: 3000,
        },
        error: {
          duration: 4000,
        },
      }} />
    </AuthProvider>
  );
}
