'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, Box, DollarSign, TrendingUp, Users, AlertTriangle, Package, Target, 
  Truck, Factory, ShoppingCart, UserCheck, ClipboardList, Calendar, Star,
  TrendingDown, Zap, Clock, CheckCircle, XCircle, AlertCircle, Bell,
  ArrowUpRight, ArrowDownRight, Eye, BarChart3, PieChart, LineChart,
  RefreshCw, Settings, Filter, Download, Maximize2, Minimize2,
  Home, FileText, Mail, LogOut, ChevronDown, User, Menu
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/currency";
import api from '../services/api';
import { NotificationService } from '@/services/notificationService';
import NotificationCenter from '@/components/ui/NotificationCenter';
import { Sidebar } from '@/components/layout/sidebar';
import { exportDashboardToPDF } from '@/lib/pdfExport';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    // Financial Data
    financialMetrics: null,
    expenses: [],
    invoices: [],
    
    // Order Management
    orders: [],
    recentOrders: [],
    
    // Customer Data
    customers: [],
    topCustomers: [],
    
    // Inventory & Materials
    rawMaterials: [],
    suppliers: [],
    materialOrders: [],
    lowStockItems: [],
    
    // Production & Delivery
    deliveries: [],
    upcomingDeliveries: [],
    productionData: null,
    
    // HR Data
    employees: [],
    hrMetrics: null,
    attendance: [],
    
    // Workload & Performance
    workloadData: null,
    systemAlerts: []
  });
  const router = useRouter();
  
  const handleNotificationAction = (notification) => {
    switch (notification.type) {
      case 'inventory':
        router.push('/raw-materials');
        break;
      case 'orders':
        router.push('/orders');
        break;
      case 'finance':
        router.push('/finance');
        break;
      case 'delivery':
        router.push('/delivery');
        break;
      case 'production':
        router.push('/production');
        break;
      case 'hr':
        router.push('/hr');
        break;
      case 'materials':
        router.push('/material-orders');
        break;
      case 'customers':
        router.push('/customers');
        break;
      default:
        fetchDashboardData();
        break;
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && userData.email) {
          // Check if user is a customer and redirect to customer dashboard
          if (userData.role === 'Customer' || userData.userType === 'Customer') {
            router.push('/dashboard/customer');
            return;
          }
          
          setUser(userData);
          fetchDashboardData();
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch data from all modules in parallel
      const dataPromises = [
        // Financial Data
        api.get('/finance/expenses').catch(() => ({ data: [] })),
        api.get('/finance/invoices').catch(() => ({ data: [] })),
        
        // Order Management
        api.get('/orders').catch(() => ({ data: [] })),
        
        // Customer Data
        api.get('/customers').catch(() => ({ data: [] })),
        
        // Inventory & Materials
        api.get('/raw-materials').catch(() => ({ data: [] })),
        api.get('/suppliers').catch(() => ({ data: [] })),
        api.get('/material-orders').catch(() => ({ data: [] })),
        
        // Delivery Data
        api.get('/delivery').catch(() => ({ data: [] })),
        
        // HR Data
        api.get('/hr/employees').catch(() => ({ data: [] })),
        api.get('/hr/attendance').catch(() => ({ data: [] }))
      ];

      const [
        expensesRes, invoicesRes, ordersRes, customersRes,
        rawMaterialsRes, suppliersRes, materialOrdersRes,
        deliveriesRes, employeesRes, attendanceRes
      ] = await Promise.all(dataPromises);

      // Process and calculate metrics
      const expenses = expensesRes.data || [];
      const invoices = invoicesRes.data || [];
      const orders = ordersRes.data || [];
      const customers = customersRes.data || [];
      const rawMaterials = rawMaterialsRes.data || [];
      const suppliers = suppliersRes.data || [];
      const materialOrders = materialOrdersRes.data || [];
      const deliveries = deliveriesRes.data || [];
      const employees = employeesRes.data || [];
      const attendance = attendanceRes.data || [];

      // Financial Calculations
      const totalRevenue = orders
        .filter(order => order.status === 'Completed')
        .reduce((sum, order) => sum + (order.total || 0), 0);
      
      const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const netProfit = totalRevenue - totalExpenses;
      
      // Order Statistics
      const completedOrders = orders.filter(order => order.status === 'Completed').length;
      const pendingOrders = orders.filter(order => order.status === 'Pending').length;
      const inProductionOrders = orders.filter(order => order.status === 'In_Production' || order.status === 'In Production').length;

      // Customer Analysis
      const topCustomersByRevenue = Object.entries(
        orders.reduce((acc, order) => {
          const customerName = order.customer_name || 'Unknown';
          if (!acc[customerName]) acc[customerName] = { orders: 0, revenue: 0 };
          acc[customerName].orders += 1;
          acc[customerName].revenue += order.total || 0;
          return acc;
        }, {})
      )
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));

      // Inventory Analysis
      const lowStockItems = rawMaterials.filter(material => 
        (material.current_stock || 0) <= (material.minimum_stock_level || 0)
      );

      // Delivery Analysis
      const todayDeliveries = deliveries.filter(delivery => {
        const deliveryDate = new Date(delivery.scheduledDate || delivery.planned_delivery_date);
        const today = new Date();
        return deliveryDate.toDateString() === today.toDateString();
      });

      const upcomingDeliveries = deliveries
        .filter(delivery => {
          const deliveryDate = new Date(delivery.scheduledDate || delivery.planned_delivery_date);
          const today = new Date();
          const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return deliveryDate >= today && deliveryDate <= nextWeek;
        })
        .sort((a, b) => new Date(a.scheduledDate || a.planned_delivery_date) - new Date(b.scheduledDate || b.planned_delivery_date))
        .slice(0, 5);

      // HR Metrics
      const todayAttendance = attendance.filter(record => {
        const recordDate = new Date(record.date);
        const today = new Date();
        return recordDate.toDateString() === today.toDateString() && record.status === 'Present';
      }).length;

      const attendanceRate = employees.length > 0 ? (todayAttendance / employees.length) * 100 : 0;

      // Generate notifications using API
      let systemAlerts = []; // Initialize systemAlerts
      
      try {
        const notificationsResponse = await api.get('/notifications');
        const businessNotifications = notificationsResponse.data.notifications || [];
        setNotifications(businessNotifications);
        
        // Legacy systemAlerts for backward compatibility
        systemAlerts = businessNotifications.map(notif => ({
          type: notif.type,
          priority: notif.priority,
          message: notif.message
        }));
      } catch (notificationError) {
        console.error('Error fetching notifications:', notificationError);
        // Fallback to client-side notifications
        const tempDashboardData = {
          financialMetrics: {
            revenue: totalRevenue,
            expenses: totalExpenses,
            profit: netProfit,
            invoicesCount: invoices.length,
            month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
          },
          expenses,
          invoices,
          orders,
          customers,
          rawMaterials,
          suppliers,
          materialOrders,
          lowStockItems,
          deliveries,
          employees,
          hrMetrics: {
            totalEmployees: employees.length,
            activeEmployees: employees.filter(emp => emp.status === 'Active').length,
            todayAttendance,
            attendanceRate
          }
        };

        const businessNotifications = NotificationService.generateBusinessNotifications(tempDashboardData);
        setNotifications(businessNotifications);
        
        // Legacy systemAlerts for backward compatibility
        systemAlerts = businessNotifications.map(notif => ({
          type: notif.type,
          priority: notif.priority,
          message: notif.message
        }));
      }

      // Update dashboard data
      setDashboardData({
        // Financial Data
        financialMetrics: {
          revenue: totalRevenue,
          expenses: totalExpenses,
          profit: netProfit,
          invoicesCount: invoices.length,
          month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        },
        expenses,
        invoices,
        
        // Order Management
        orders,
        recentOrders: orders.slice(0, 5),
        
        // Customer Data
        customers,
        topCustomers: topCustomersByRevenue,
        
        // Inventory & Materials
        rawMaterials,
        suppliers,
        materialOrders,
        lowStockItems,
        
        // Production & Delivery
        deliveries,
        upcomingDeliveries,
        productionData: {
          completed: completedOrders,
          inProduction: inProductionOrders,
          pending: pendingOrders,
          todayDeliveries: todayDeliveries.length
        },
        
        // HR Data
        employees,
        hrMetrics: {
          totalEmployees: employees.length,
          activeEmployees: employees.filter(emp => emp.status === 'Active').length,
          todayAttendance,
          attendanceRate
        },
        attendance,
        
        // Workload & Performance
        workloadData: {
          totalTasks: orders.length,
          completedTasks: completedOrders,
          inProgressTasks: inProductionOrders,
          overdueDeliveries: deliveries.filter(d => new Date(d.scheduledDate || d.planned_delivery_date) < new Date()).length
        },
        systemAlerts
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    setUser(null);
    router.push('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMinimize = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  const handleExportDashboard = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportDashboardToPDF();
    } catch (error) {
      console.error('Dashboard PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'default';
      case 'in_production': 
      case 'in production': return 'secondary';
      case 'pending': return 'outline';
      case 'ready_for_delivery': 
      case 'ready for delivery': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center space-y-8">
          {/* Company Logo and Name */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src="/logo.png"
                alt="First Promovier Logo"
                className="h-20 w-20 rounded-full shadow-2xl border-4 border-white"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-[#049532]">First Promovier</h1>
              <p className="text-xl text-gray-600 font-medium">Admin Dashboard</p>
            </div>
          </div>

          {/* Loading Animation */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#049532] border-t-transparent absolute top-0 left-0"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg text-gray-700 font-medium">Loading comprehensive dashboard...</p>
              <p className="text-sm text-gray-500">Please wait while we prepare your business intelligence</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-64 mx-auto">
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-[#049532] to-emerald-500 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Initializing system components...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 w-full max-w-full overflow-x-hidden">
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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area - Adjusts width instead of being pushed */}
      <div
        id="dashboard-content"
        className={`w-full transition-all duration-300 ${sidebarMinimized ? 'lg:w-[calc(100%-64px)]' : 'lg:w-[calc(100%-256px)]'} lg:ml-auto`}
      >
        {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 transition-all duration-300 w-full max-w-full overflow-visible">
        <div className="w-full max-w-full px-2 sm:px-4 lg:px-6 overflow-visible">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={toggleSidebar}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <img
                src="/logo.png"
                alt="First Promovier Logo"
                className="h-10 w-10 rounded-full"
              />
              <div>
                <h1 className="text-xl font-bold text-[#049532]">First Promovier</h1>
                <p className="text-xs text-gray-600">Admin Dashboard</p>
              </div>
            </div>


            {/* User Profile */}
            <div className="flex items-center space-x-4">
              <NotificationCenter 
                notifications={notifications}
                onAction={handleNotificationAction}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchDashboardData}
                disabled={loading}
                className="flex items-center space-x-2 border-[#049532] text-[#049532] hover:bg-[#049532] hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100">
                    <div className="w-8 h-8 bg-[#049532] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'A'}
                      </span>
                    </div>
                    <span className="text-gray-700 font-medium">
                      {user?.name || user?.email?.split('@')[0] || 'Admin'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name || 'Admin'}
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
                    <span>Orders</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/customers')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Customers</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/finance')}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Finance</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/hr')}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    <span>HR</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/delivery')}>
                    <Truck className="mr-2 h-4 w-4" />
                    <span>Delivery</span>
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
      <main className="w-full max-w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 transition-all duration-300 overflow-x-hidden">
  <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full max-w-full overflow-hidden">
              {/* Modern Header with Glassmorphism */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 via-emerald-600/10 to-teal-600/10 rounded-3xl blur-3xl"></div>
                <div className="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl w-full max-w-full overflow-hidden">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 w-full max-w-full overflow-hidden">
                    <div className="space-y-4 w-full max-w-full overflow-hidden">
                      <div className="flex items-center gap-2 sm:gap-4 flex-wrap w-full max-w-full overflow-hidden">
                        <div className="p-2 sm:p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg flex-shrink-0">
                          <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                        </div>
                        <div className="w-full max-w-full overflow-hidden">
                          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent break-words">
                            Business Intelligence Dashboard
            </h1>
                          <p className="text-base sm:text-lg lg:text-xl text-slate-600 mt-2 break-words">
                            Welcome back, <span className="font-semibold text-slate-800">{user?.name || user?.email || 'Admin'}</span>! 
                            <span className="block text-sm sm:text-base lg:text-lg text-slate-500 mt-1">Here's your complete business overview</span>
            </p>
                        </div>
          </div> 
          
                      {/* Quick Stats Bar */}
                      <div className="flex flex-wrap gap-2 sm:gap-4 w-full max-w-full overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-700">System Online</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
                          <Activity className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-700">Real-time Updates</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchDashboardData}
                        className="bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80 transition-all duration-300"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
          </div>
        </div>
        
        {/* Legacy System Alerts (Fallback) */}
        {dashboardData.systemAlerts?.length > 0 && notifications.length === 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                System Alerts ({dashboardData.systemAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {dashboardData.systemAlerts.slice(0, 3).map((alert, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(alert.priority)} className="text-xs">
                      {alert.type}
                    </Badge>
                    <span className="text-sm text-orange-700">{alert.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

              {/* Modern KPI Cards with Glassmorphism */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Revenue Card */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                          <DollarSign className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-sm font-semibold text-slate-700">Total Revenue</CardTitle>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600">
                        <ArrowUpRight className="h-4 w-4" />
                        <span className="text-xs font-medium">+12.5%</span>
                      </div>
            </CardHeader>
            <CardContent>
                      <div className="text-3xl font-bold text-slate-800 mb-2">
                {formatCurrency(dashboardData.financialMetrics?.revenue || 0)}
              </div>
                      <p className="text-xs text-slate-500 mb-4">
                {dashboardData.financialMetrics?.month}
              </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Target Progress</span>
                          <span className="text-slate-600 font-medium">
                            {Math.min((dashboardData.financialMetrics?.revenue || 0) / 50000 * 100, 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ 
                              width: `${Math.min((dashboardData.financialMetrics?.revenue || 0) / 50000 * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
              </div>
            </CardContent>
          </Card>
                </div>

                {/* Profit Card */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-sm font-semibold text-slate-700">Net Profit</CardTitle>
                      </div>
                      <div className={`flex items-center gap-1 ${dashboardData.financialMetrics?.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {dashboardData.financialMetrics?.profit >= 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        <span className="text-xs font-medium">
                          {dashboardData.financialMetrics?.profit >= 0 ? '+8.2%' : '-3.1%'}
                        </span>
                      </div>
            </CardHeader>
            <CardContent>
                      <div className={`text-3xl font-bold mb-2 ${dashboardData.financialMetrics?.profit >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                {formatCurrency(dashboardData.financialMetrics?.profit || 0)}
              </div>
                      <p className="text-xs text-slate-500 mb-4">
                        {dashboardData.financialMetrics?.profit >= 0 ? 'Profitable Operations' : 'Operating at Loss'}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Profit Margin</span>
                          <span className="text-slate-600 font-medium">
                            {dashboardData.financialMetrics?.revenue > 0 
                              ? ((dashboardData.financialMetrics.profit / dashboardData.financialMetrics.revenue) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ease-out ${
                              dashboardData.financialMetrics?.profit >= 0 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                : 'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ 
                              width: `${Math.max(0, Math.min(Math.abs(dashboardData.financialMetrics?.profit || 0) / 10000 * 100, 100))}%` 
                            }}
                          ></div>
                        </div>
              </div>
            </CardContent>
          </Card>
                </div>

                {/* Orders Card */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-lg">
                          <ShoppingCart className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-sm font-semibold text-slate-700">Active Orders</CardTitle>
                      </div>
                      <div className="flex items-center gap-1 text-teal-600">
                        <Activity className="h-4 w-4" />
                        <span className="text-xs font-medium">Live</span>
                      </div>
            </CardHeader>
            <CardContent>
                      <div className="text-3xl font-bold text-slate-800 mb-2">
                {dashboardData.orders?.length || 0}
              </div>
                      <p className="text-xs text-slate-500 mb-4">
                        {dashboardData.productionData?.pending || 0} pending • {dashboardData.productionData?.inProduction || 0} in production
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Completion Rate</span>
                          <span className="text-slate-600 font-medium">
                            {dashboardData.orders?.length > 0 ? 
                              ((dashboardData.productionData?.completed || 0) / dashboardData.orders.length * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${dashboardData.orders?.length > 0 ? 
                        (dashboardData.productionData?.completed || 0) / dashboardData.orders.length * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
                </div>

                {/* Team Performance Card */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-lime-500/20 to-green-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-lime-500 to-green-500 rounded-xl shadow-lg">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-sm font-semibold text-slate-700">Team Performance</CardTitle>
                      </div>
                      <div className="flex items-center gap-1 text-lime-600">
                        <UserCheck className="h-4 w-4" />
                        <span className="text-xs font-medium">Active</span>
                      </div>
            </CardHeader>
            <CardContent>
                      <div className="text-3xl font-bold text-slate-800 mb-2">
                {dashboardData.hrMetrics?.attendanceRate?.toFixed(1) || 0}%
              </div>
                      <p className="text-xs text-slate-500 mb-4">
                {dashboardData.hrMetrics?.todayAttendance || 0} of {dashboardData.hrMetrics?.totalEmployees || 0} present today
              </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Attendance Rate</span>
                          <span className="text-slate-600 font-medium">
                            {dashboardData.hrMetrics?.attendanceRate?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-lime-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ 
                              width: `${dashboardData.hrMetrics?.attendanceRate || 0}%` 
                            }}
                          ></div>
                        </div>
              </div>
            </CardContent>
          </Card>
                </div>
        </div>

              {/* Modern Business Intelligence Tabs */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-100/50 to-green-100/50 rounded-3xl blur-2xl"></div>
                <div className="relative bg-white/60 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl">
        <Tabs defaultValue="operations" className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                          <PieChart className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-800">Business Intelligence</h2>
                          <p className="text-sm text-slate-600">Comprehensive analytics and insights</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                      </div>
                    </div>
                    
                    <TabsList className="grid w-full grid-cols-6 bg-white/50 backdrop-blur-sm border border-white/20 rounded-2xl p-1">
                      <TabsTrigger 
                        value="operations" 
                        className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-600 rounded-xl transition-all duration-300"
                      >
                        <Factory className="h-4 w-4 mr-2" />
                        Operations
                      </TabsTrigger>
                      <TabsTrigger 
                        value="financial"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 rounded-xl transition-all duration-300"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Financial
                      </TabsTrigger>
                      <TabsTrigger 
                        value="inventory"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-teal-600 rounded-xl transition-all duration-300"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Inventory
                      </TabsTrigger>
                      <TabsTrigger 
                        value="customers"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 rounded-xl transition-all duration-300"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Customers
                      </TabsTrigger>
                      <TabsTrigger 
                        value="hr"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-purple-600 rounded-xl transition-all duration-300"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        HR
                      </TabsTrigger>
                      <TabsTrigger 
                        value="logistics"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-cyan-600 rounded-xl transition-all duration-300"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Logistics
                      </TabsTrigger>
          </TabsList>

          {/* Operations Overview */}
          <TabsContent value="operations" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Production Pipeline */}
                        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-slate-800">
                              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                                <Factory className="h-5 w-5 text-white" />
                              </div>
                    Production Pipeline
                  </CardTitle>
                            <CardDescription className="text-slate-600">Current production status across all orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                              <div className="group text-center p-6 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                <div className="text-3xl font-bold text-yellow-700 mb-2">
                        {dashboardData.productionData?.pending || 0}
                      </div>
                                <p className="text-sm font-medium text-yellow-600">Pending</p>
                                <div className="mt-2 w-full bg-yellow-200 rounded-full h-1">
                                  <div className="bg-yellow-500 h-1 rounded-full w-3/4"></div>
                    </div>
                              </div>
                              <div className="group text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                <div className="text-3xl font-bold text-blue-700 mb-2">
                        {dashboardData.productionData?.inProduction || 0}
                      </div>
                                <p className="text-sm font-medium text-blue-600">In Production</p>
                                <div className="mt-2 w-full bg-blue-200 rounded-full h-1">
                                  <div className="bg-blue-500 h-1 rounded-full w-2/3"></div>
                    </div>
                              </div>
                              <div className="group text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                <div className="text-3xl font-bold text-green-700 mb-2">
                        {dashboardData.productionData?.completed || 0}
                      </div>
                                <p className="text-sm font-medium text-green-600">Completed</p>
                                <div className="mt-2 w-full bg-green-200 rounded-full h-1">
                                  <div className="bg-green-500 h-1 rounded-full w-4/5"></div>
                    </div>
                              </div>
                              <div className="group text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                                <div className="text-3xl font-bold text-purple-700 mb-2">
                        {dashboardData.productionData?.todayDeliveries || 0}
                      </div>
                                <p className="text-sm font-medium text-purple-600">Today's Deliveries</p>
                                <div className="mt-2 w-full bg-purple-200 rounded-full h-1">
                                  <div className="bg-purple-500 h-1 rounded-full w-1/2"></div>
                                </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
                        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-slate-800">
                              <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-lg">
                                <ClipboardList className="h-5 w-5 text-white" />
                              </div>
                    Recent Orders
                  </CardTitle>
                            <CardDescription className="text-slate-600">Latest customer orders requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                            <div className="space-y-4">
                    {dashboardData.recentOrders?.slice(0, 5).map((order, index) => (
                                <div key={index} className="group flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-green-50 rounded-2xl border border-slate-200 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                                  <div className="flex items-center gap-4">
                                    <div className="relative">
                                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                                      <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500/30 animate-ping"></div>
                                    </div>
                          <div>
                                      <p className="font-semibold text-sm text-slate-800">{order.orderId}</p>
                                      <p className="text-xs text-slate-600">{order.customer_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                                    <Badge 
                                      variant={getStatusColor(order.status)} 
                                      className="text-xs font-medium px-3 py-1 rounded-full"
                                    >
                            {order.status?.replace('_', ' ')}
                          </Badge>
                                    <p className="text-sm font-bold text-slate-800 mt-2">{formatCurrency(order.total || 0)}</p>
                        </div>
                      </div>
                    )) || (
                                <div className="text-center py-12">
                                  <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
                                    <ClipboardList className="h-8 w-8 text-slate-400" />
                                  </div>
                                  <p className="text-sm text-slate-500 font-medium">No recent orders</p>
                                  <p className="text-xs text-slate-400 mt-1">Orders will appear here when customers place them</p>
                                </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Overview */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
                        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-600">
                              <DollarSign className="h-5 w-5" />
                    Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Completed Orders</span>
                                <span className="font-medium text-emerald-600">
                        {formatCurrency(dashboardData.financialMetrics?.revenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Generated Invoices</span>
                      <span className="font-medium">
                        {dashboardData.invoices?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average Order Value</span>
                      <span className="font-medium">
                        {formatCurrency(
                          dashboardData.orders?.length > 0 
                            ? (dashboardData.financialMetrics?.revenue || 0) / dashboardData.orders.length 
                            : 0
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

                        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                              <TrendingDown className="h-5 w-5" />
                    Expense Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Expenses</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(dashboardData.financialMetrics?.expenses || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Number of Expenses</span>
                      <span className="font-medium">
                        {dashboardData.expenses?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Profit Margin</span>
                      <span className="font-medium">
                        {dashboardData.financialMetrics?.revenue > 0 
                          ? ((dashboardData.financialMetrics.profit / dashboardData.financialMetrics.revenue) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

                        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-600">
                              <Star className="h-5 w-5" />
                    Top Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.topCustomers?.slice(0, 5).map((customer, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{customer.name}</span>
                        <div className="text-right">
                                    <span className="text-sm text-emerald-600 font-medium">
                            {formatCurrency(customer.revenue)}
                          </span>
                          <p className="text-xs text-muted-foreground">{customer.orders} orders</p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground text-center py-4">No customer data</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Inventory Management */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-600">
                              <AlertTriangle className="h-5 w-5" />
                    Inventory Alerts
                  </CardTitle>
                  <CardDescription>Materials requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.lowStockItems?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{item.material_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Current: {item.current_stock} | Min: {item.minimum_stock_level}
                          </p>
                        </div>
                        <Badge variant={item.current_stock === 0 ? 'destructive' : 'secondary'}>
                          {item.current_stock === 0 ? 'Out of Stock' : 'Low Stock'}
                        </Badge>
                      </div>
                    )) || (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-sm text-green-600 font-medium">All inventory levels are healthy!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

                        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Material Orders Status
                  </CardTitle>
                  <CardDescription>Recent material order activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-700">
                          {dashboardData.materialOrders?.filter(order => order.status === 'Pending').length || 0}
                        </div>
                        <p className="text-xs text-blue-600">Pending</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-700">
                          {dashboardData.materialOrders?.filter(order => order.status === 'Delivered').length || 0}
                        </div>
                        <p className="text-xs text-yellow-600">Delivered</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-700">
                          {dashboardData.suppliers?.length || 0}
                        </div>
                        <p className="text-xs text-gray-600">Suppliers</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Customers */}
          <TabsContent value="customers" className="space-y-6">
                      <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Customer Analytics
                </CardTitle>
                <CardDescription>Customer engagement and revenue insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-4">Customer Overview</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Customers</span>
                        <span className="font-medium">{dashboardData.customers?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active Customers</span>
                                  <span className="font-medium text-emerald-600">
                          {dashboardData.topCustomers?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average Order Value</span>
                        <span className="font-medium">
                          {formatCurrency(
                            dashboardData.topCustomers?.length > 0
                              ? dashboardData.topCustomers.reduce((sum, c) => sum + c.revenue, 0) / 
                                dashboardData.topCustomers.reduce((sum, c) => sum + c.orders, 0)
                              : 0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">Top Customers by Revenue</h4>
                    <div className="space-y-2">
                      {dashboardData.topCustomers?.slice(0, 3).map((customer, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-medium text-green-600">{index + 1}</span>
                            </div>
                            <span className="text-sm font-medium">{customer.name}</span>
                          </div>
                                    <span className="text-sm text-emerald-600 font-medium">
                            {formatCurrency(customer.revenue)}
                          </span>
                        </div>
                      )) || (
                        <p className="text-sm text-muted-foreground">No customer data available</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Human Resources */}
          <TabsContent value="hr" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Overview
                  </CardTitle>
                  <CardDescription>Employee status and attendance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">
                          {dashboardData.hrMetrics?.totalEmployees || 0}
                        </div>
                        <p className="text-sm text-blue-600">Total Staff</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">
                          {dashboardData.hrMetrics?.activeEmployees || 0}
                        </div>
                        <p className="text-sm text-green-600">Active</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Today's Attendance</span>
                        <span className="font-medium">
                          {dashboardData.hrMetrics?.todayAttendance || 0} / {dashboardData.hrMetrics?.totalEmployees || 0}
                        </span>
                      </div>
                      <Progress value={dashboardData.hrMetrics?.attendanceRate || 0} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {dashboardData.hrMetrics?.attendanceRate?.toFixed(1) || 0}% attendance rate
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

                        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Attendance Trends
                  </CardTitle>
                  <CardDescription>Recent attendance patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {dashboardData.hrMetrics?.attendanceRate?.toFixed(0) || 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">Weekly Average</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-green-50 rounded">
                        <div className="font-medium text-green-700">Present</div>
                        <div className="text-green-600">{dashboardData.hrMetrics?.todayAttendance || 0}</div>
                      </div>
                      <div className="p-2 bg-red-50 rounded">
                        <div className="font-medium text-red-700">Absent</div>
                        <div className="text-red-600">
                          {(dashboardData.hrMetrics?.totalEmployees || 0) - (dashboardData.hrMetrics?.todayAttendance || 0)}
                        </div>
                      </div>
                      <div className="p-2 bg-yellow-50 rounded">
                        <div className="font-medium text-yellow-700">Late</div>
                        <div className="text-yellow-600">0</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Logistics */}
          <TabsContent value="logistics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Schedule
                  </CardTitle>
                  <CardDescription>Upcoming deliveries and logistics overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.upcomingDeliveries?.map((delivery, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{delivery.deliveryId || delivery.order_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {delivery.customer?.name || delivery.customer_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(delivery.scheduledDate || delivery.planned_delivery_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(delivery.scheduledDate || delivery.planned_delivery_date).toLocaleDateString() === new Date().toLocaleDateString() 
                              ? 'Today' 
                              : `${Math.ceil((new Date(delivery.scheduledDate || delivery.planned_delivery_date) - new Date()) / (1000 * 60 * 60 * 24))} days`
                            }
                          </p>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8">
                        <Truck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No upcoming deliveries scheduled</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

                        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Workload Summary
                  </CardTitle>
                  <CardDescription>Current operational workload status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-700">
                          {dashboardData.workloadData?.totalTasks || 0}
                        </div>
                        <p className="text-xs text-purple-600">Total Tasks</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-700">
                          {dashboardData.workloadData?.inProgressTasks || 0}
                        </div>
                        <p className="text-xs text-orange-600">In Progress</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Completion Rate</span>
                        <span className="font-medium">
                          {dashboardData.workloadData?.totalTasks > 0 
                            ? ((dashboardData.workloadData.completedTasks / dashboardData.workloadData.totalTasks) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={
                          dashboardData.workloadData?.totalTasks > 0 
                            ? (dashboardData.workloadData.completedTasks / dashboardData.workloadData.totalTasks) * 100
                            : 0
                        } 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </div>
      </div>
    </main>
      </div>
    </div>
  );
}