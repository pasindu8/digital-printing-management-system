'use client';

// Role-based access control configuration
export const rolePermissions = {
  'Customer': {
    allowedRoutes: [
      '/dashboard',
      '/dashboard/customer', 
      '/orders',
      '/delivery',
      '/settings'
    ],
    redirectTo: '/dashboard/customer'
  },
  'Admin': {
    allowedRoutes: [
      '/dashboard',
      '/orders',
      '/customers',
      '/raw-materials',
      '/suppliers',
      '/material-orders',
      '/my-tasks',
      '/delivery',
      '/finance',
      '/billing',
      '/reports',
      '/hr',
      '/workload',
      '/settings'
    ],
    redirectTo: '/dashboard'
  },
  'General_Manager': {
    allowedRoutes: [
      '/dashboard',
      '/orders',
      '/customers',
      '/raw-materials',
      '/suppliers',
      '/material-orders',
      '/my-tasks',
      '/delivery',
      '/finance',
      '/billing',
      '/reports',
      '/hr',
      '/workload',
      '/settings'
    ],
    redirectTo: '/dashboard'
  },
  'Order_Manager': {
    allowedRoutes: [
      '/dashboard',
      '/orders',
      '/customers',
      '/my-tasks',
      '/delivery',
      '/settings'
    ],
    redirectTo: '/dashboard'
  },
  'Stock_Manager': {
    allowedRoutes: [
      '/dashboard',
      '/orders',
      '/customers',
      '/raw-materials',
      '/suppliers',
      '/material-orders',
      '/my-tasks',
      '/delivery',
      '/settings'
    ],
    redirectTo: '/dashboard'
  },
  'HR_Manager': {
    allowedRoutes: [
      '/dashboard',
      '/orders',
      '/customers',
      '/raw-materials',
      '/suppliers',
      '/material-orders',
      '/my-tasks',
      '/delivery',
      '/finance',
      '/billing',
      '/reports',
      '/hr',
      '/workload',
      '/settings'
    ],
    redirectTo: '/dashboard'
  },
  'Delivery_Person': {
    allowedRoutes: [
      '/delivery',
      '/my-tasks',
      '/settings'
    ],
    redirectTo: '/delivery'
  },
  'Staff': {
    allowedRoutes: [
      '/dashboard',
      '/orders',
      '/customers',
      '/raw-materials',
      '/suppliers',
      '/material-orders',
      '/my-tasks',
      '/delivery',
      '/finance',
      '/billing',
      '/reports',
      '/hr',
      '/workload',
      '/settings'
    ],
    redirectTo: '/dashboard'
  },
  'Employee': {
    allowedRoutes: [
      '/dashboard',
      '/orders',
      '/customers',
      '/raw-materials',
      '/suppliers',
      '/material-orders',
      '/my-tasks',
      '/delivery',
      '/finance',
      '/billing',
      '/reports',
      '/hr',
      '/workload',
      '/settings'
    ],
    redirectTo: '/dashboard'
  }
};

// Check if user has access to a specific route
export function hasAccess(userRole, route) {
  if (!userRole || !rolePermissions[userRole]) {
    return false;
  }
  
  return rolePermissions[userRole].allowedRoutes.includes(route);
}

// Get redirect URL for a specific role
export function getRedirectUrl(userRole) {
  if (!userRole || !rolePermissions[userRole]) {
    return '/login';
  }
  
  return rolePermissions[userRole].redirectTo;
}

// Get user data from localStorage
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  
  try {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!user || !token) return null;
    
    return JSON.parse(user);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  return !!(token && user);
}

// Logout user
export function logout() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  
  window.location.href = '/login';
}
