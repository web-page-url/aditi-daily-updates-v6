// SEO Configuration for Aditi Daily Updates System
// Centralized SEO constants and utilities

export const SEO_CONFIG = {
  // Site Information
  siteName: 'Aditi Daily Updates System',
  siteDescription: 'Enterprise task management and daily progress tracking system for teams and organizations',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://aditi-daily-updates.vercel.app',
  
  // Company Information
  companyName: 'Aditi Consulting',
  companyUrl: 'https://aditiconsulting.com',
  
  // Default Meta Tags
  defaultTitle: 'Aditi Daily Updates - Enterprise Task Management System',
  defaultDescription: 'Streamline your team\'s daily progress tracking with Aditi Daily Updates - the enterprise solution for task management, team collaboration, and project monitoring.',
  defaultKeywords: [
    'task management',
    'daily updates', 
    'team collaboration',
    'project tracking',
    'enterprise software',
    'productivity tools',
    'Aditi Consulting',
    'team management',
    'progress tracking',
    'workflow optimization',
    'employee portal',
    'business application'
  ],
  
  // Social Media
  social: {
    twitter: '@AditiConsulting',
    linkedin: 'aditi-consulting',
  },
  
  // Images
  images: {
    logo: '/aditi.png',
    defaultOgImage: '/aditi.png',
    favicon: '/favicon.ico',
  },
  
  // Application Info
  version: '6.0.0',
  lastUpdated: '2025-01-13',
  
  // Features list for structured data
  features: [
    'Secure user authentication',
    'Role-based access control',
    'Daily task tracking', 
    'Team collaboration',
    'Progress monitoring',
    'Blocker identification',
    'Real-time collaboration',
    'Export capabilities',
    'Email notifications',
    'Mobile responsive design'
  ],

  // Page-specific configurations
  pages: {
    home: {
      title: 'Login | Aditi Daily Updates - Enterprise Task Management System',
      description: 'Secure login to Aditi Daily Updates - the enterprise solution for daily task tracking, team management, and project collaboration. Access your team dashboard and manage daily progress efficiently.',
      keywords: [
        'Aditi login',
        'employee portal', 
        'task management login',
        'daily updates',
        'team collaboration',
        'project tracking',
        'enterprise software',
        'productivity dashboard',
        'team management system',
        'Aditi Consulting login'
      ]
    },
    dashboard: {
      title: 'Dashboard | Aditi Daily Updates - Team Management Hub',
      description: 'Comprehensive team management dashboard for tracking daily progress, monitoring tasks, and managing team collaboration. View real-time updates, export reports, and manage team productivity.',
      keywords: [
        'team dashboard',
        'task management dashboard',
        'progress tracking',
        'team management',
        'daily updates dashboard',
        'project monitoring',
        'team collaboration hub',
        'productivity dashboard'
      ]
    }
  }
};

// Utility functions for SEO
export const generatePageTitle = (pageTitle?: string): string => {
  if (!pageTitle) return SEO_CONFIG.defaultTitle;
  return `${pageTitle} | ${SEO_CONFIG.siteName}`;
};

export const generateMetaDescription = (description?: string): string => {
  return description || SEO_CONFIG.defaultDescription;
};

export const generateCanonicalUrl = (path: string = ''): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SEO_CONFIG.siteUrl}${cleanPath}`;
};

export const generateOpenGraphData = (page?: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}) => {
  return {
    title: page?.title || SEO_CONFIG.defaultTitle,
    description: page?.description || SEO_CONFIG.defaultDescription,
    image: page?.image || SEO_CONFIG.images.defaultOgImage,
    url: page?.url || SEO_CONFIG.siteUrl,
    siteName: SEO_CONFIG.siteName,
    type: 'website',
    locale: 'en_US'
  };
};

export const generateTwitterCardData = (page?: {
  title?: string;
  description?: string;
  image?: string;
}) => {
  return {
    card: 'summary_large_image',
    site: SEO_CONFIG.social.twitter,
    creator: SEO_CONFIG.social.twitter,
    title: page?.title || SEO_CONFIG.defaultTitle,
    description: page?.description || SEO_CONFIG.defaultDescription,
    image: page?.image || SEO_CONFIG.images.defaultOgImage,
    imageAlt: 'Aditi Daily Updates System Dashboard'
  };
}; 