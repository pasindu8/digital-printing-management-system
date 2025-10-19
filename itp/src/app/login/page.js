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
        
        // Store user role and redirect based on role
        const userRole = user.role;
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', user.name);
        
        // Redirect admins to dashboard, others to homepage
        if (userRole === 'Admin' || userRole === 'General_Manager' || userRole === 'Order_Manager' || userRole === 'Stock_Manager' || userRole === 'HR_Manager') {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
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
        
        // Store user role and redirect based on role
        const userRole = data.user.role;
        console.log('User role:', userRole);
        
        // Store role separately for easy access
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', data.user.name);
        
        // Redirect admins to dashboard, others to homepage
        if (userRole === 'Admin' || userRole === 'General_Manager' || userRole === 'Order_Manager' || userRole === 'Stock_Manager' || userRole === 'HR_Manager') {
          router.push('/dashboard');
        } else {
          router.push('/');
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <Card className="relative w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8">
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-30"></div>
              <div className="relative p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl">
                <img
                  src="/logo.png"
                  alt="First Promovier Logo" 
                  className="rounded-full w-20 h-20"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              First Promovier
            </h1>
            <p className="text-slate-700 font-semibold text-lg">Sign in to your account</p>
            <p className="text-sm text-slate-600">Welcome back to the Print Management System</p>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Username</label>
              <Input
                type="email"
                placeholder="e.g. john.doe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white/50 backdrop-blur-sm border-white/30 focus:border-green-500 focus:ring-green-500/20 rounded-xl transition-all duration-300"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white/50 backdrop-blur-sm border-white/30 focus:border-green-500 focus:ring-green-500/20 rounded-xl transition-all duration-300"
              />
              <div className="text-right mt-2">
                <button 
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              onClick={handleLogin}
              disabled={loading || oauthLoading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
              <span className="text-sm text-slate-500 font-medium">Or continue with</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleGoogleLogin}
                disabled={loading || oauthLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white/60 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg ring-1 ring-white/30 hover:bg-white/80 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {oauthLoading === 'google' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-slate-600"></div>
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
        <div className="text-center mt-8 mb-6">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <button 
              onClick={() => router.push('/signup')}
              className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
            >
              Sign up here
            </button>
          </p>
        </div>

        <div className="text-center text-xs text-slate-400 mt-6">
          © 2025 The First Promovier. All rights reserved.
        </div>
      </Card>
    </div>
  );
}
