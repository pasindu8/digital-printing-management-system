'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  User, 
  FileText, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Printer,
  Package,
  CreditCard,
  Settings,
  LogOut,
  ChevronDown,
  RefreshCw,
  DollarSign,
  Receipt,
  Download,
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

export default function CustomerBilling() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMinimize = () => setSidebarMinimized(!sidebarMinimized);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && userData.email) {
          if (userData.role === 'customer' || userData.userType === 'customer' || userData.role === 'Customer') {
            setUser(userData);
            setLoading(false);
            return;
          } else {
            router.push('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  }, [router]);

  // Fetch user's invoices from orders
  const fetchInvoices = async () => {
    if (!user) return;
    
    setInvoicesLoading(true);
    try {
      // Try multiple approaches to get user orders (same as customer dashboard)
      let userOrders = [];
      
      // Approach 1: Try to get orders by customer email
      if (user.email) {
        try {
          const response = await api.get(`/orders?customerEmail=${encodeURIComponent(user.email)}`);
          userOrders = response.data || [];
          console.log('Billing - Orders by email:', userOrders);
        } catch (error) {
          console.log('Billing - Error fetching by email:', error);
        }
      }
      
      // Approach 2: If no orders found by email, try getting all orders and filter
      if (userOrders.length === 0) {
        try {
          const response = await api.get('/orders');
          console.log('Billing - All orders from API:', response.data);
          console.log('Billing - Current user:', user);
          
          // More comprehensive filtering
          userOrders = response.data.filter(order => {
            const emailMatch = order.customer_email === user.email;
            const idMatch = order.customer_id === user.id || order.customer_id === user.customerId;
            const nameMatch = order.customer_name === user.name;
            
            console.log(`Billing - Order ${order.orderId}: email=${emailMatch}, id=${idMatch}, name=${nameMatch}`);
            return emailMatch || idMatch || nameMatch;
          });
          
          console.log('Billing - Filtered user orders:', userOrders);
        } catch (error) {
          console.error('Billing - Error fetching all orders:', error);
        }
      }
      
      // If still no orders found, show all orders for debugging
      if (userOrders.length === 0) {
        console.log('Billing - No user-specific orders found, showing all orders for debugging');
        try {
          const response = await api.get('/orders');
          userOrders = response.data.slice(0, 5); // Show first 5 orders
        } catch (error) {
          console.error('Billing - Error fetching orders for debugging:', error);
        }
      }
      
      // Transform orders to invoice format
      const userInvoices = userOrders.map(order => {
        let invoiceStatus = 'pending';
        if (order.payment_status === 'paid' && order.payment_receipt?.verified) {
          invoiceStatus = 'paid';
        } else if (order.payment_receipt?.filename && !order.payment_receipt?.verified) {
          invoiceStatus = 'pending'; // Payment uploaded but not verified
        } else if (order.payment_status === 'pending') {
          // Check if overdue (assuming 30 days payment term)
          const dueDate = new Date(order.orderDate);
          dueDate.setDate(dueDate.getDate() + 30);
          if (new Date() > dueDate) {
            invoiceStatus = 'overdue';
          } else {
            invoiceStatus = 'pending';
          }
        }

        return {
          _id: order._id,
          invoiceId: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
          orderId: order.orderId,
          customer: {
            name: order.customer_name,
            email: order.customer_email
          },
          issueDate: order.orderDate,
          dueDate: (() => {
            const due = new Date(order.orderDate);
            due.setDate(due.getDate() + 30); // 30 days payment term
            return due;
          })(),
          status: invoiceStatus,
          total: order.final_amount || order.total,
          paymentMethod: order.payment_receipt?.verified ? order.payment_method : null,
          paidDate: order.payment_receipt?.verifiedDate || null,
          items: order.items || [],
          notes: order.notes || '',
          payment_receipt: order.payment_receipt,
          order_status: order.status
        };
      });
      
      console.log('Billing - Transformed invoices:', userInvoices);
      setInvoices(userInvoices);
      
      // Calculate summary
      const totalInvoices = userInvoices.length;
      const totalAmount = userInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const paidAmount = userInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
      const pendingAmount = userInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.total || 0), 0);
      
      setSummary({
        totalInvoices,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount: userInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.total || 0), 0)
      });
      
    } catch (error) {
      console.error('Billing - Error fetching invoices:', error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  // Fetch invoices when user is loaded
  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    setUser(null);
    router.push('/');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount) => {
    return `Rs. ${(amount || 0).toFixed(2)}`;
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading billing information...</p>
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
                  <p className="text-xs text-gray-600">Customer Billing</p>
                </div>
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchInvoices}
                  disabled={invoicesLoading}
                  className="bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80 transition-all duration-300"
                >
                  <RefreshCw className={`h-4 w-4 ${invoicesLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100">
                      <div className="w-8 h-8 bg-[#049532] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="text-gray-700 font-medium">
                        {user?.name || user?.email?.split('@')[0] || 'User'}
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
                          {user?.email || 'No email'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Homepage</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/customer')}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>My Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/orders')}>
                      <Package className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
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
                        <Receipt className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          Customer Billing
                        </h1>
                        <p className="text-xl text-slate-600 mt-2">
                          View your invoices, payment status, and billing history
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Total Invoices Card */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Total Invoices</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 mb-2">{summary.totalInvoices}</div>
                    <p className="text-xs text-slate-500">All invoices</p>
                  </CardContent>
                </Card>
              </div>

              {/* Total Amount Card */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Total Amount</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 mb-2">{formatCurrency(summary.totalAmount)}</div>
                    <p className="text-xs text-slate-500">All invoices</p>
                  </CardContent>
                </Card>
              </div>

              {/* Paid Amount Card */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Paid</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 mb-2">{formatCurrency(summary.paidAmount)}</div>
                    <p className="text-xs text-slate-500">Completed payments</p>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Amount Card */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Pending</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 mb-2">{formatCurrency(summary.pendingAmount)}</div>
                    <p className="text-xs text-slate-500">Awaiting payment</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Invoices Table */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-white/20">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
                    <Receipt className="h-5 w-5 text-white" />
                  </div>
                  Your Invoices
                </CardTitle>
                <CardDescription className="text-slate-600">All your invoices and payment status</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {invoicesLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-sm text-slate-500 mt-2">Loading invoices...</p>
                  </div>
                ) : invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-b border-white/20">
                          <TableHead className="font-semibold text-slate-700">Invoice #</TableHead>
                          <TableHead className="font-semibold text-slate-700">Order #</TableHead>
                          <TableHead className="font-semibold text-slate-700">Date</TableHead>
                          <TableHead className="font-semibold text-slate-700">Due Date</TableHead>
                          <TableHead className="font-semibold text-slate-700">Status</TableHead>
                          <TableHead className="text-right font-semibold text-slate-700">Amount</TableHead>
                          <TableHead className="font-semibold text-slate-700">Payment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice._id} className="border-b border-white/20 hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-medium text-slate-800">{invoice.invoiceId}</TableCell>
                            <TableCell className="text-slate-600">{invoice.orderId}</TableCell>
                            <TableCell className="text-slate-600">{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                            <TableCell className="text-slate-600">{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge className={`${getStatusBadge(invoice.status)} shadow-sm font-medium px-3 py-1 rounded-full`}>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-slate-800">
                              {formatCurrency(invoice.total)}
                            </TableCell>
                            <TableCell>
                              {invoice.paymentMethod ? (
                                <div>
                                  <div className="text-sm text-slate-700">{invoice.paymentMethod}</div>
                                  <div className="text-xs text-slate-500">
                                    {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : '-'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
                      <Receipt className="h-12 w-12 text-slate-400" />
                    </div>
                    <p className="text-slate-500 mb-4 font-medium">No invoices found</p>
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

            {/* Quick Actions */}
            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/customer')}
                className="bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80 transition-all duration-300"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                <span>Back to Dashboard</span>
              </Button>
              <Button 
                onClick={() => router.push('/orders')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg"
              >
                <Package className="h-4 w-4 mr-2" />
                <span>View Orders</span>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
