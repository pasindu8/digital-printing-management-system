'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔄 Sending forgot password request for:', email);
      
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('📧 Forgot password response:', data);

      if (response.ok) {
        setEmailSent(true);
        setMessage(data.message);
        console.log('✅ Reset email sent successfully');
        
        // Log reset URL for development testing
        if (data.resetUrl) {
          console.log('🔗 Development Reset URL:', data.resetUrl);
        }
      } else {
        console.error('❌ Forgot password failed:', data);
        alert('Error: ' + (data.message || 'Unknown error occurred'));
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      alert('Network error occurred. Please check if the backend server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#cccccc] p-4">
        <Card className="w-full max-w-md shadow-lg rounded-2xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500 p-3 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Email Sent!</h1>
              <p className="text-gray-600 mt-2">Check your inbox</p>
            </div>

            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <p className="text-green-800 text-center mb-4">
                {message}
              </p>
              <p className="text-green-700 text-sm text-center">
                We've sent a verification code to <strong>{email}</strong>
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Next steps:</h3>
              <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Find the 6-digit verification code</li>
                <li>Enter the code on the reset password page Click <a href='http://localhost:3000/reset-password'>here</a></li>
                <li>Create a new password</li>
                <li>Log in with your new password</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="w-full"
              >
                Resend Email
              </Button>
              
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>

            {/* Help */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#cccccc] p-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <Mail className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Forgot Password</h1>
            <p className="text-gray-600 mt-2">Reset your account password</p>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-sm text-center">
              Enter your email address and we'll send you a verification code to reset your password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-6">
            <Button
              onClick={() => router.push('/login')}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>

          {/* Help */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Remember your password? 
              <button 
                onClick={() => router.push('/login')}
                className="text-blue-500 hover:text-blue-600 ml-1"
              >
                Sign in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
