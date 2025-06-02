import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        {/* Basic Meta Tags */}
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* SEO Meta Tags */}
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        
        {/* Performance and Security */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Standard favicons with proper sizes and types */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        
        {/* Apple Touch Icons for iOS devices */}
        <link rel="apple-touch-icon" href="/aditi.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/aditi.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/aditi.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/aditi.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/aditi.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/aditi.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/aditi.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/aditi.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/aditi.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/aditi.png" />
        
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preconnect to critical domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* Critical fonts with font-display swap for performance */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/aditi.png" as="image" type="image/png" />
        
        {/* Business/Organization Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Aditi Daily Updates System",
              "description": "Enterprise task management and daily progress tracking system for teams and organizations",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "Aditi Consulting",
                "url": "https://aditiconsulting.com"
              },
              "softwareVersion": "6.0",
              "datePublished": "2025-01-13",
              "dateModified": new Date().toISOString(),
              "featureList": [
                "Daily task tracking",
                "Team management",
                "Progress monitoring", 
                "Blocker identification",
                "Real-time collaboration",
                "Role-based access control",
                "Export capabilities",
                "Email notifications"
              ],
              "screenshot": "/aditi.png",
              "softwareHelp": {
                "@type": "CreativeWork",
                "url": "/setup"
              }
            })
          }}
        />
        
        {/* Organization structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization", 
              "name": "Aditi Consulting",
              "description": "Leading provider of enterprise software solutions and consulting services",
              "url": "https://aditiconsulting.com",
              "logo": "/aditi.png",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": "English"
              },
              "sameAs": [
                "https://www.linkedin.com/company/aditi-consulting"
              ]
            })
          }}
        />
        
        {/* WebSite structured data for search box */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Aditi Daily Updates System",
              "description": "Enterprise daily task tracking and team management platform",
              "url": process.env.NEXT_PUBLIC_SITE_URL || "https://aditi-daily-updates.vercel.app",
              "inLanguage": "en-US",
              "copyrightYear": new Date().getFullYear(),
              "creator": {
                "@type": "Organization",
                "name": "Aditi Consulting"
              }
            })
          }}
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
