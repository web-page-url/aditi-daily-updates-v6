import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Head from 'next/head';

export default function TestReset() {
  const [urlInfo, setUrlInfo] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const analyzeUrl = () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash;
      const search = window.location.search;
      const href = window.location.href;
      const pathname = window.location.pathname;
      const origin = window.location.origin;

      // Parse URL parameters manually
      const parseUrlParams = (url: string) => {
        const params: Record<string, string> = {};
        
        // Extract from hash
        if (url.includes('#')) {
          const hashPart = url.split('#')[1];
          if (hashPart) {
            hashPart.split('&').forEach(param => {
              const [key, value] = param.split('=');
              if (key && value) {
                params[key] = decodeURIComponent(value);
              }
            });
          }
        }
        
        // Extract from search params
        if (url.includes('?')) {
          const searchPart = url.split('?')[1].split('#')[0];
          if (searchPart) {
            searchPart.split('&').forEach(param => {
              const [key, value] = param.split('=');
              if (key && value) {
                params[key] = decodeURIComponent(value);
              }
            });
          }
        }
        
        return params;
      };

      const urlParams = parseUrlParams(href);

      setUrlInfo({
        hash,
        search,
        href,
        pathname,
        origin,
        urlParams,
        hasRecoveryInHash: hash?.includes('type=recovery'),
        hasAccessTokenInHash: hash?.includes('access_token='),
        hasRecoveryInSearch: search?.includes('type=recovery'),
        hasAccessTokenInSearch: search?.includes('access_token='),
        hasRecoveryType: urlParams.type === 'recovery',
        hasAccessToken: !!urlParams.access_token,
        router: router.query
      });
    };

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        setSessionInfo({
          data,
          error,
          hasSession: !!data.session,
          hasUser: !!data.session?.user,
          userEmail: data.session?.user?.email,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        setSessionInfo({
          error: err,
          timestamp: new Date().toISOString()
        });
      }
    };

    analyzeUrl();
    checkSession();
  }, [router.query]);

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white p-8">
      <Head>
        <title>Password Reset Debug | Aditi Daily Updates</title>
      </Head>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Password Reset Debug Information</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#1e2538] p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-purple-400">URL Information</h2>
            <pre className="text-sm bg-gray-900 p-4 rounded overflow-auto">
              {JSON.stringify(urlInfo, null, 2)}
            </pre>
          </div>
          
          <div className="bg-[#1e2538] p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Session Information</h2>
            <pre className="text-sm bg-gray-900 p-4 rounded overflow-auto">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="mt-8 bg-[#1e2538] p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-green-400">Actions</h2>
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded mr-4"
            >
              Refresh Page
            </button>
            <button
              onClick={() => router.push('/reset-password')}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mr-4"
            >
              Go to Reset Password
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Go to Login
            </button>
          </div>
        </div>
        
        <div className="mt-8 bg-yellow-900/30 border border-yellow-700 p-4 rounded-lg">
          <h3 className="text-yellow-300 font-bold mb-2">Instructions:</h3>
          <ol className="text-sm space-y-1">
            <li>1. Click the password reset link from your email</li>
            <li>2. If it redirects to /reset-password, check the URL and session info above</li>
            <li>3. If it redirects here (/test-reset), copy the URL and paste it in /reset-password</li>
            <li>4. Share this debug information if the reset isn't working</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 