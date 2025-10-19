'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  User, 
  Settings,
  LogOut,
  Plus,
  Eye,
  Download,
  ChevronDown,
  Home,
  Mail,
  Menu
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from '@/components/layout/sidebar';
import api from '../../services/api';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMinimize = () => setSidebarMinimized(!sidebarMinimized);

  // Fetch user's orders
  const fetchOrders = async () => {
    if (!user) return;
    
    setOrdersLoading(true);
    try {
      // Try multiple approaches to get user orders
      let userOrders = [];
      
      // Approach 1: Try to get orders by customer email
      if (user.email) {
        try {
          const response = await api.get(`/orders?customerEmail=${encodeURIComponent(user.email)}`);
          userOrders = response.data || [];
        } catch (error) {
          console.log('Error fetching by email:', error);
        }
      }
      
      // Approach 2: If no orders found by email, try getting all orders and filter
      if (userOrders.length === 0) {
        try {
          const response = await api.get('/orders');
          
          // More comprehensive filtering
          userOrders = response.data.filter(order => {
            const emailMatch = order.customer_email === user.email || 
                             order.customerInfo?.email === user.email ||
                             order.customer?.email === user.email ||
                             order.customerEmail === user.email;
            const idMatch = order.customer_id === user.id || order.customer_id === user.customerId;
            const nameMatch = order.customer_name === user.name;
            
            return emailMatch || idMatch || nameMatch;
          });
        } catch (error) {
          console.error('Error fetching all orders:', error);
        }
      }
      
      setOrders(userOrders.slice(0, 5)); // Show only recent 5 orders
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

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

  // Fetch orders when user is loaded
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 w-full max-w-full overflow-x-hidden flex">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        isMinimized={sidebarMinimized}
        toggleMinimize={toggleMinimize}
      />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarMinimized ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl sticky top-0 z-50">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Logo */}
              <div className="flex items-center space-x-3">
                <img
                  src="/logo.png"
                  alt="First Promovier Logo"
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <h1 className="text-xl font-bold text-[#049532]">First Promovier</h1>
                  <p className="text-xs text-gray-600">Customer Dashboard</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100">
                      <div className="w-8 h-8 bg-[#049532] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="text-gray-700 font-medium">
                        {user?.name || user?.email?.split('@')[0] || 'Customer'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.name || 'Customer'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/')}>
                      <Home className="mr-2 h-4 w-4" />
                      <span>Homepage</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/orders')}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/customer-billing')}>
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Billing</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/delivery')}>
                      <Truck className="mr-2 h-4 w-4" />
                      <span>Track Delivery</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Modern Header */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 via-emerald-600/10 to-teal-600/10 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          Welcome back, {user?.name?.split(' ')[0] || 'Customer'}!
                        </h1>
                        <p className="text-xl text-slate-600 mt-2">
                          Manage your orders and track your printing projects
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Place New Order Card */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 cursor-pointer" onClick={() => router.push('/orders')}>
                  <CardHeader className="text-center">
                    <div className="mx-auto p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-lg w-fit mb-4">
                      <Plus className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg text-slate-800">Place New Order</CardTitle>
                    <CardDescription className="text-slate-600">Start a new printing project</CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {/* View Orders Card */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 cursor-pointer" onClick={() => router.push('/orders')}>
                  <CardHeader className="text-center">
                    <div className="mx-auto p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg w-fit mb-4">
                      <Eye className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg text-slate-800">View Orders</CardTitle>
                    <CardDescription className="text-slate-600">Track your existing orders</CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {/* Billing Card */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 cursor-pointer" onClick={() => router.push('/customer-billing')}>
                  <CardHeader className="text-center">
                    <div className="mx-auto p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg w-fit mb-4">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg text-slate-800">Billing</CardTitle>
                    <CardDescription className="text-slate-600">View invoices and payments</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Recent Orders & Order Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders Card */}
              <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-white/20">
                  <CardTitle className="flex items-center gap-3 text-slate-800">
                    <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    Recent Orders
                  </CardTitle>
                  <CardDescription className="text-slate-600">Your latest printing projects</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {ordersLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-sm text-slate-500 mt-2">Loading orders...</p>
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-4 p-6">
                      {orders.map((order, index) => {
                        const getStatusColor = (status) => {
                          switch (status?.toLowerCase()) {
                            case 'completed':
                            case 'delivered':
                              return 'bg-green-100 text-green-800';
                            case 'in progress':
                            case 'processing':
                              return 'bg-blue-100 text-blue-800';
                            case 'pending':
                              return 'bg-yellow-100 text-yellow-800';
                            case 'cancelled':
                              return 'bg-red-100 text-red-800';
                            default:
                              return 'bg-gray-100 text-gray-800';
                          }
                        };

                        const getOrderIcon = (productName) => {
                          if (productName?.toLowerCase().includes('business card')) {
                            return <FileText className="h-5 w-5 text-[#049532]" />;
                          } else if (productName?.toLowerCase().includes('banner')) {
                            return <FileText className="h-5 w-5 text-blue-600" />;
                          } else if (productName?.toLowerCase().includes('flyer')) {
                            return <FileText className="h-5 w-5 text-purple-600" />;
                          } else if (productName?.toLowerCase().includes('poster')) {
                            return <FileText className="h-5 w-5 text-orange-600" />;
                          } else {
                            return <Package className="h-5 w-5 text-[#049532]" />;
                          }
                        };

                        // Get product name from various possible fields
                        const getProductName = (order) => {
                          // First try to get from items array (most reliable)
                          if (order.items && order.items.length > 0) {
                            const firstItem = order.items[0];
                            if (firstItem.product) {
                              return firstItem.product;
                            }
                            if (firstItem.productName) {
                              return firstItem.productName;
                            }
                            if (firstItem.name) {
                              return firstItem.name;
                            }
                          }
                          
                          // Fallback to other fields
                          return order.productName || 
                                 order.product_name || 
                                 order.product?.name || 
                                 order.orderType || 
                                 order.type || 
                                 'Print Order';
                        };

                        const productName = getProductName(order);
                        
                        // Debug logging to see what data we're getting
                        console.log('Order data:', order);
                        console.log('Product name extracted:', productName);

                        // Get all product names if multiple items
                        const getAllProductNames = (order) => {
                          if (order.items && order.items.length > 0) {
                            return order.items.map(item => item.product || item.productName || item.name).filter(Boolean);
                          }
                          return [productName];
                        };

                        const allProducts = getAllProductNames(order);
                        const displayName = allProducts.length > 1 
                          ? `${allProducts[0]} +${allProducts.length - 1} more`
                          : productName;

                        return (
                          <div key={order.orderId || order._id || index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-green-50 rounded-2xl border border-slate-200 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-[#049532]/10 rounded-lg">
                                {getOrderIcon(productName)}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-slate-800">{displayName}</p>
                                <p className="text-sm text-slate-600">
                                  Order #{order.orderId || order._id || `ORD-${index + 1}`}
                                </p>
                                {order.total && (
                                  <p className="text-xs text-slate-500">LKR {order.total.toLocaleString()}</p>
                                )}
                                {order.items && order.items.length > 0 && (
                                  <p className="text-xs text-slate-500">
                                    {order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)} items
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={`${getStatusColor(order.status)} shadow-sm font-medium px-3 py-1 rounded-full`}>
                                {order.status || 'Pending'}
                              </Badge>
                              {(order.createdAt || order.orderDate) && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(order.createdAt || order.orderDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <div className="text-center pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => router.push('/orders')}
                          className="w-full bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80 transition-all duration-300"
                        >
                          View All Orders
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
                        <Package className="h-12 w-12 text-slate-400" />
                      </div>
                      <p className="text-slate-500 mb-4 font-medium">No orders found</p>
                      <Button 
                        onClick={() => router.push('/orders')}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg"
                      >
                        Place Your First Order
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Status Card */}
              <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-white/20">
                  <CardTitle className="flex items-center gap-3 text-slate-800">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                      <Truck className="h-5 w-5 text-white" />
                    </div>
                    Order Status
                  </CardTitle>
                  <CardDescription className="text-slate-600">Track your order progress</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {(() => {
                      const totalOrders = orders.length;
                      const completedOrders = orders.filter(order => 
                        order.status?.toLowerCase() === 'completed' || 
                        order.status?.toLowerCase() === 'delivered'
                      ).length;
                      const pendingOrders = orders.filter(order => 
                        order.status?.toLowerCase() === 'pending'
                      ).length;
                      const inProgressOrders = orders.filter(order => 
                        order.status?.toLowerCase() === 'in progress' || 
                        order.status?.toLowerCase() === 'processing'
                      ).length;

                      return (
                        <>
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">Completed Orders</p>
                              <p className="text-xs text-slate-600">{completedOrders} of {totalOrders} orders completed</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Clock className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">In Progress</p>
                              <p className="text-xs text-slate-600">{inProgressOrders} orders being processed</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Clock className="h-5 w-5 text-yellow-600" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">Pending Orders</p>
                              <p className="text-xs text-slate-600">{pendingOrders} orders awaiting processing</p>
                            </div>
                          </div>

                          {totalOrders > 0 && (
                            <div className="pt-4 border-t border-white/20">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Total Orders:</span>
                                <span className="font-medium text-slate-800">{totalOrders}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Completion Rate:</span>
                                <span className="font-medium text-green-600">
                                  {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => router.push('/delivery')}
                        className="w-full bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80 transition-all duration-300"
                      >
                        Track Delivery
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Account Settings */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-white/20">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  <div className="p-2 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl shadow-lg">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  Account Settings
                </CardTitle>
                <CardDescription className="text-slate-600">Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-green-50 rounded-2xl border border-slate-200">
                      <label className="text-sm font-medium text-slate-700">Full Name</label>
                      <p className="text-slate-800 font-medium">{user?.name || 'Not provided'}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-green-50 rounded-2xl border border-slate-200">
                      <label className="text-sm font-medium text-slate-700">Email</label>
                      <p className="text-slate-800 font-medium">{user?.email}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-green-50 rounded-2xl border border-slate-200">
                      <label className="text-sm font-medium text-slate-700">Account Type</label>
                      <p className="text-slate-800 font-medium">Customer</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80 transition-all duration-300">
                      <User className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" className="w-full bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80 transition-all duration-300">
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </Button>
                    <Button variant="outline" className="w-full bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80 transition-all duration-300">
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoices
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}