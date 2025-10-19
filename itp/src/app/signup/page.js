'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, User, Mail, Lock, CheckCircle } from "lucide-react";

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePassword = (pwd) => {
    const minLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecial,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers
    };
  };

  const passwordValidation = validatePassword(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill in all fields');
      return;
    }

    if (!passwordValidation.isValid) {
      alert('Please ensure your password meets all requirements');
      return;
    }

    if (!passwordsMatch) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔄 Registering user:', formData.email);
      
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'Customer' // Default role for new users - customers
        }),
      });

      const data = await response.json();
      console.log('📧 Registration response:', data);

      if (response.ok) {
        setRegistrationSuccess(true);
        setMessage(data.message);
        console.log('✅ Registration successful');
      } else {
        console.error('❌ Registration failed:', data);
        alert('Error: ' + (data.message || 'Registration failed'));
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      alert('Network error occurred. Please check if the backend server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success page after registration
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <Card className="relative w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-30"></div>
                <div className="relative p-4 bg-white/90 backdrop-blur-sm rounded-full shadow-xl">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Registration Successful!
              </h1>
              <div className="p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/30">
                <p className="text-green-700 font-medium">{message}</p>
              </div>
            </div>
            
            <div className="space-y-3 mt-8">
              <Button
                onClick={() => router.push('/verify-email')}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Verify Email
              </Button>
              <Button
                onClick={() => router.push('/login')}
                variant="outline"
                className="w-full h-12 bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/80 text-slate-700 rounded-xl font-semibold transition-all duration-300"
              >
                Back to Login
              </Button>
            </div>
            
            <div className="mt-6 text-sm text-slate-600">
              <p className="font-medium">Check your email for a verification link.</p>
              <p>You can log in after verifying your email address.</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <Card className="relative w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-30"></div>
              <div className="relative p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl">
                <User className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-slate-700 font-semibold text-lg">Join First Promovier</p>
            <p className="text-sm text-slate-600">Digital Printing Management System</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full h-12 pl-10 bg-white/50 backdrop-blur-sm border-white/30 focus:border-green-500 focus:ring-green-500/20 rounded-xl transition-all duration-300"
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full h-12 pl-10 bg-white/50 backdrop-blur-sm border-white/30 focus:border-green-500 focus:ring-green-500/20 rounded-xl transition-all duration-300"
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full h-12 pl-10 pr-12 bg-white/50 backdrop-blur-sm border-white/30 focus:border-green-500 focus:ring-green-500/20 rounded-xl transition-all duration-300"
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Password Requirements */}
            {formData.password && (
              <div className="mt-3 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/30">
                <p className="text-xs font-semibold text-slate-700 mb-2">Password requirements:</p>
                <div className="space-y-2">
                  {[
                    { key: 'minLength', text: 'At least 8 characters' },
                    { key: 'hasUpperCase', text: 'One uppercase letter' },
                    { key: 'hasLowerCase', text: 'One lowercase letter' },
                    { key: 'hasNumbers', text: 'One number' }
                  ].map(({ key, text }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${passwordValidation[key] ? 'bg-green-500' : 'bg-slate-300'} transition-colors duration-200`}></div>
                      <span className={`text-xs font-medium ${passwordValidation[key] ? 'text-green-600' : 'text-slate-500'} transition-colors duration-200`}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full h-12 pl-10 pr-12 bg-white/50 backdrop-blur-sm border-white/30 focus:border-green-500 focus:ring-green-500/20 rounded-xl transition-all duration-300"
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div className="mt-2 flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${passwordsMatch ? 'bg-green-500' : 'bg-red-500'} transition-colors duration-200`}></div>
                <span className={`text-xs font-medium ${passwordsMatch ? 'text-green-600' : 'text-red-600'} transition-colors duration-200`}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !passwordValidation.isValid || !passwordsMatch}
            className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <button 
              onClick={() => router.push('/login')}
              className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
            >
              Sign in here
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

