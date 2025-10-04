'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, hasAccess, getRedirectUrl, isAuthenticated } from '../middleware/auth';

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
}

// Access denied component
function AccessDenied({ userRole, requiredRoute }) {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to appropriate dashboard after 3 seconds
    const timer = setTimeout(() => {
      const redirectUrl = getRedirectUrl(userRole);
      router.push(redirectUrl);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [userRole, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-sm text-gray-500 mb-4">
          You don't have permission to access this page.
        </p>
        <p className="text-xs text-gray-400">
          Redirecting to your dashboard in 3 seconds...
        </p>
      </div>
    </div>
  );
}

// HOC for route protection
export function withAuth(WrappedComponent, allowedRoles = []) {
  return function ProtectedRoute(props) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [hasPermission, setHasPermission] = useState(false);
    const router = useRouter();

    useEffect(() => {
      const checkAuth = () => {
        // Check if user is authenticated
        if (!isAuthenticated()) {
          router.push('/login');
          return;
        }

        const currentUser = getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }

        setUser(currentUser);

        // If no specific roles required, allow access
        if (allowedRoles.length === 0) {
          setHasPermission(true);
          setLoading(false);
          return;
        }

        // Check if user role is allowed
        const userRole = currentUser.role;
        if (allowedRoles.includes(userRole)) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
        }

        setLoading(false);
      };

      checkAuth();
    }, [router]);

    if (loading) {
      return <LoadingScreen />;
    }

    if (!hasPermission) {
      return <AccessDenied userRole={user?.role} requiredRoute={window.location.pathname} />;
    }

    return <WrappedComponent {...props} />;
  };
}

// Route-based protection hook
export function useRouteProtection() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkRouteAccess = () => {
      const currentPath = window.location.pathname;
      
      // Allow access to public routes
      const publicRoutes = ['/login', '/signup', '/customer-auth', '/forgot-password', '/reset-password', '/verify-email'];
      if (publicRoutes.includes(currentPath)) {
        setLoading(false);
        return;
      }

      // Check authentication
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      const currentUser = getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      // Check route access
      if (!hasAccess(currentUser.role, currentPath)) {
        const redirectUrl = getRedirectUrl(currentUser.role);
        router.push(redirectUrl);
        return;
      }

      setLoading(false);
    };

    checkRouteAccess();
  }, [router]);

  return { loading, user };
}
