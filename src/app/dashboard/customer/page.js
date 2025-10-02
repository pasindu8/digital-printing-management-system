'use client';

import CustomerDashboard from '@/components/CustomerDashboard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && userData.email) {
          // Check if user is actually a customer
          if (userData.role === 'customer' || userData.userType === 'customer' || userData.role === 'Customer') {
            setUser(userData);
            setLoading(false);
            return;
          } else {
            // If not a customer, redirect to main dashboard
            router.push('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // If no valid user data, redirect to login
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your customer dashboard...</p>
        </div>
      </div>
    );
  }

  return <CustomerDashboard />;
}