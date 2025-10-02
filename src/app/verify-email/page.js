'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, CheckCircle, XCircle, RefreshCw, Shield } from "lucide-react";

export default function VerifyEmail() {
  const [status, setStatus] = useState('input'); // 'input', 'verifying', 'success', 'error'
  const [verificationCode, setVerificationCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if there's a token in URL for backward compatibility
    const token = searchParams.get('token');
    
    if (token) {
      setHasToken(true);
      verifyEmailToken(token);
    } else {
      setHasToken(false);
    }
  }, [searchParams]);

  const verifyEmailToken = async (token) => {
    setStatus('verifying');
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

  const verifyEmailCode = async (code) => {
    setLoading(true);
    setStatus('verifying');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
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
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      alert('Please enter a valid 6-digit verification code');
      return;
    }
    
    verifyEmailCode(verificationCode);
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

  if (hasToken) {
    // Original token-based verification UI
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

  // New code-based verification UI
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

          {status === 'success' ? (
            // Success state
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold mb-3 text-green-600">
                Email Verified Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your email has been verified. You can now access your account.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm">
                  You will be redirected to the login page shortly.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/login')}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                Continue to Login
              </Button>
            </div>
          ) : (
            // Code input form
            <div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-3 text-gray-800">
                  Enter Verification Code
                </h2>
                <p className="text-gray-600 text-sm">
                  We've sent a 6-digit verification code to your email address. 
                  Please enter it below to verify your account.
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-6">
                {/* Code Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                  />
                </div>

                {/* Error Message */}
                {status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">
                      {message || 'Invalid or expired verification code. Please try again.'}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={status === 'verifying' || verificationCode.length !== 6}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                >
                  {status === 'verifying' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </Button>
              </form>

              {/* Resend Section */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-3 text-center">
                  Didn't receive the code?
                </p>
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={handleResendVerification}
                    disabled={resendLoading || !resendEmail}
                    variant="outline"
                    className="w-full"
                  >
                    {resendLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend Verification Code'
                    )}
                  </Button>
                </div>
              </div>

              {/* Back to Login */}
              <div className="mt-4">
                <Button
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Code expires in 15 minutes. Having trouble? Contact support for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
