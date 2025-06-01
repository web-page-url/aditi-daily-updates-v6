import { useState, useEffect } from 'react';
import AuthOTP from './AuthOTP';
import AuthPassword from './AuthPassword';

export default function AuthSelector() {
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('password');

  // Reset to Password method on component mount (changed from OTP)
  useEffect(() => {
    setAuthMethod('password');
  }, []);

  const handleMethodChange = (method: 'otp' | 'password') => {
    setAuthMethod(method);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1f2e] px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#1e2538] p-8 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Choose your preferred sign-in method
          </p>
        </div>

        {/* Auth method selector - Reordered to show Password first, Magic Link second */}
        <div className="flex rounded-md shadow-sm mt-6" role="group">
          <button
            type="button"
            onClick={() => handleMethodChange('password')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-l-lg border border-gray-600 
              ${authMethod === 'password' 
                ? 'bg-purple-600 text-white border-purple-600' 
                : 'bg-[#262d40] text-gray-300 hover:bg-[#2a3349]'
              } focus:z-10 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange('otp')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-r-lg border border-gray-600 
              ${authMethod === 'otp' 
                ? 'bg-purple-600 text-white border-purple-600' 
                : 'bg-[#262d40] text-gray-300 hover:bg-[#2a3349]'
              } focus:z-10 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors`}
          >
            Magic Link
          </button>
        </div>

        {/* Auth component based on selection */}
        <div key={authMethod}>
          {authMethod === 'otp' ? (
            <AuthOTP embedded={true} />
          ) : (
            <AuthPassword embedded={true} />
          )}
        </div>

        {/* Troubleshooting & Setup Link - COMMENTED OUT */}
        {/*
        <div className="text-center mt-6 pt-4 border-t border-gray-600">
          <p className="text-xs text-gray-400 mb-2">
            Having trouble logging in?
          </p>
          <a 
            href="/setup" 
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors underline"
          >
            Database Setup & Troubleshooting
          </a>
        </div>
        */}
      </div>
    </div>
  );
} 