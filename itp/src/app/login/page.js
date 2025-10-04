// File path: src/app/login/page.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Github, Mail } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      alert('OAuth authentication failed. Please try again.');
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/dashboard');
      } catch (error) {
        console.error('Error parsing OAuth callback:', error);
        alert('Authentication error. Please try again.');
      }
    }
  }, [searchParams, router]);

  const handleGoogleLogin = async () => {
    setOauthLoading('google');
    
    // Redirect to backend OAuth endpoint
    window.location.href = 'http://localhost:5000/api/auth/google';
    
    // Note: The loading state will persist until the page redirects
    // The callback will handle setting loading to false
  };

  const handleGitHubLogin = async () => {
    setOauthLoading('github');
    
    // Redirect to backend GitHub OAuth endpoint
    window.location.href = 'http://localhost:5000/api/auth/github';
    
    // Note: The loading state will persist until the page redirects
    // The callback will handle setting loading to false
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Role-based redirection
        const userRole = data.user.role;
        console.log('User role:', userRole);
        
        // Store role separately for easy access
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', data.user.name);
        
        switch (userRole) {
          case 'Admin':
          case 'General_Manager':
          case 'Order_Manager':
          case 'Stock_Manager':
          case 'HR_Manager':
            router.push('/dashboard');
            break;
          case 'Customer':
            router.push('/dashboard/customer'); // Redirect customers to customer dashboard
            break;
          case 'Delivery_Person':
            router.push('/delivery');
            break;
          case 'Staff':
          case 'Employee':
            router.push('/dashboard');
            break;
          default:
            router.push('/dashboard');
        }
      } else {
        alert('Login failed: ' + data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#cccccc]">
      <Card className="w-full max-w-md shadow-lg rounded-2xl p-6">
        <div className="text-center mb-6">
          {/* Logo */}
          <div className="flex justify-center mb-3">
            <div className="p-1 rounded-full">
              <img
                src="/logo.png"
                alt="First Promovier Logo" className="rounded-full w-[90px] h-[90px]"></img>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#049532]">First Promovier</h1><br></br>
          <p className="text-gray-800 font-bold mt-1">Sign in to your account</p>
          <p className="text-sm text-gray-800">Welcome back to the Print Management System</p>
        </div>

        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Username</label>
              <Input
                type="email"
                placeholder="e.g. john.doe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
              <div className="text-right mt-1">
                <button 
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-sm text-blue-500 hover:underline bg-transparent border-none cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-lg disabled:opacity-50"
              onClick={handleLogin}
              disabled={loading || oauthLoading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>

            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-sm text-gray-400">Or continue with</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handleGoogleLogin}
                disabled={loading || oauthLoading}
                className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4285F4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {oauthLoading === 'google' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                ) : (
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path><path d="M1 1h22v22H1z" fill="none"></path>
                  </svg>
                )}
                <span className="text-sm font-semibold leading-6">
                  {oauthLoading === 'google' ? 'Connecting...' : 'Google'}
                </span>
              </button>
              
            </div>
          </div>
        </CardContent>

        {/* Sign up link */}
        <div className="text-center mt-6 mb-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button 
              onClick={() => router.push('/signup')}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Sign up here
            </button>
          </p>
        </div>

        <div className="text-center text-xs text-gray-400 mt-6">
          © 2025 The First Promovier. All rights reserved.
        </div>
      </Card>
    </div>
  );
}
