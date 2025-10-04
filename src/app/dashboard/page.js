'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, Box, DollarSign, TrendingUp, Users, AlertTriangle, Package, Target, 
  Truck, Factory, ShoppingCart, UserCheck, ClipboardList, Calendar, Star,
  TrendingDown, Zap, Clock, CheckCircle, XCircle, AlertCircle, Bell
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/currency";
import api from '../services/api';
import { NotificationService } from '@/services/notificationService';
import NotificationCenter from '@/components/ui/NotificationCenter';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
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
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading comprehensive dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header with Notifications */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {user?.role == 'Admin' && ( <span>Business Intelligence</span>)} Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Welcome back, {user?.name || user?.email || 'User'}!  {user?.role == 'Admin' && ( <span>Here's your complete business overview.</span>)}
            </p>
          </div> 
          
          {/* Notification Center */}
          <div className="flex items-center gap-3">
            <NotificationCenter 
              notifications={notifications}
              onAction={(notification) => {
                // Handle notification actions
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
                  case 'hr':
                    router.push('/hr');
                    break;
                  case 'delivery':
                    router.push('/delivery');
                    break;
                  case 'materials':
                    router.push('/material-orders');
                    break;
                  case 'customers':
                    router.push('/customers');
                    break;
                  default:
                    // Refresh dashboard for system alerts
                    fetchDashboardData();
                }
              }}
            />
            
            <Button variant="outline" size="sm" onClick={fetchDashboardData}>
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
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

        {/* Key Performance Indicators */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {formatCurrency(dashboardData.financialMetrics?.revenue || 0)}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {dashboardData.financialMetrics?.month}
              </p>
              <div className="mt-3">
                <Progress 
                  value={Math.min((dashboardData.financialMetrics?.revenue || 0) / 50000 * 100, 100)} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Net Profit</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {formatCurrency(dashboardData.financialMetrics?.profit || 0)}
              </div>
              <p className="text-xs text-green-600 mt-1">
                {dashboardData.financialMetrics?.profit >= 0 ? 'Profitable' : 'Operating at loss'}
              </p>
              <div className="mt-3">
                <Progress 
                  value={Math.max(0, Math.min((dashboardData.financialMetrics?.profit || 0) / 10000 * 100, 100))} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Active Orders</CardTitle>
              <ShoppingCart className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {dashboardData.orders?.length || 0}
              </div>
              <p className="text-xs text-purple-600 mt-1">
                {dashboardData.productionData?.pending || 0} pending, {dashboardData.productionData?.inProduction || 0} in production
              </p>
              <div className="flex gap-2 mt-3">
                <div className="flex-1 bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${dashboardData.orders?.length > 0 ? 
                        (dashboardData.productionData?.completed || 0) / dashboardData.orders.length * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Team Performance</CardTitle>
              <Users className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                {dashboardData.hrMetrics?.attendanceRate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-orange-600 mt-1">
                {dashboardData.hrMetrics?.todayAttendance || 0} of {dashboardData.hrMetrics?.totalEmployees || 0} present today
              </p>
              <div className="mt-3">
                <Progress 
                  value={dashboardData.hrMetrics?.attendanceRate || 0} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Intelligence Tabs */}
        <Tabs defaultValue="operations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="hr">Human Resources</TabsTrigger>
            <TabsTrigger value="logistics">Logistics</TabsTrigger>
          </TabsList>

          {/* Operations Overview */}
          <TabsContent value="operations" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Production Pipeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="h-5 w-5" />
                    Production Pipeline
                  </CardTitle>
                  <CardDescription>Current production status across all orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-700">
                        {dashboardData.productionData?.pending || 0}
                      </div>
                      <p className="text-sm text-yellow-600">Pending</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">
                        {dashboardData.productionData?.inProduction || 0}
                      </div>
                      <p className="text-sm text-blue-600">In Production</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        {dashboardData.productionData?.completed || 0}
                      </div>
                      <p className="text-sm text-green-600">Completed</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-2xl font-bold text-purple-700">
                        {dashboardData.productionData?.todayDeliveries || 0}
                      </div>
                      <p className="text-sm text-purple-600">Today's Deliveries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Recent Orders
                  </CardTitle>
                  <CardDescription>Latest customer orders requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.recentOrders?.slice(0, 5).map((order, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <div>
                            <p className="font-medium text-sm">{order.orderId}</p>
                            <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusColor(order.status)} className="text-xs">
                            {order.status?.replace('_', ' ')}
                          </Badge>
                          <p className="text-xs font-medium mt-1">{formatCurrency(order.total || 0)}</p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Overview */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Completed Orders</span>
                      <span className="font-medium text-green-600">
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    Top Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.topCustomers?.slice(0, 5).map((customer, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{customer.name}</span>
                        <div className="text-right">
                          <span className="text-sm text-green-600 font-medium">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
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

              <Card>
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
            <Card>
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
                        <span className="font-medium text-green-600">
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
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                            </div>
                            <span className="text-sm font-medium">{customer.name}</span>
                          </div>
                          <span className="text-sm text-green-600 font-medium">
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
              <Card>
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

              <Card>
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
              <Card>
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

              <Card>
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
    </MainLayout>
  );
}
