'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function VerifyEmail() {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error', 'expired'
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      verifyEmailToken(token);
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [searchParams]);

  const verifyEmailToken = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message);
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while verifying your email');
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmail) {
      alert('Please enter your email address');
      return;
    }

    setResendLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Verification email sent successfully!');
        setResendEmail('');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('An error occurred while sending verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return <RefreshCw className="h-16 w-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Mail className="h-16 w-16 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'verifying':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <Mail className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Email Verification</h1>
            <p className="text-gray-600 mt-2">Digital Printing Management System</p>
          </div>

          {/* Status Display */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            
            <h2 className={`text-xl font-semibold mb-3 ${getStatusColor()}`}>
              {status === 'verifying' && 'Verifying Your Email...'}
              {status === 'success' && 'Email Verified Successfully!'}
              {status === 'error' && 'Verification Failed'}
            </h2>
            
            <p className="text-gray-600 mb-4">
              {message || 'Please wait while we verify your email address.'}
            </p>

            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 text-sm">
                  Your email has been verified! You will be redirected to the login page shortly.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {status === 'success' && (
              <Button 
                onClick={() => router.push('/login')}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                Continue to Login
              </Button>
            )}

            {status === 'error' && (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm mb-3">
                    Your verification link may have expired or is invalid.
                  </p>
                  <div className="space-y-2">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <Button
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="w-full bg-red-500 hover:bg-red-600"
                    >
                      {resendLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Resend Verification Email'
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            )}

            {status === 'verifying' && (
              <Button
                onClick={() => router.push('/login')}
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Having trouble? Contact support for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
