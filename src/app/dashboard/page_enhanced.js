// File path: src/app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';

import { Activity, Box, DollarSign, TrendingUp, Users, AlertTriangle, Package, Download, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    financialMetrics: null,
    recentOrders: [],
    upcomingDeliveries: [],
    productionData: null,
    hrMetrics: null
  });
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && userData.email) {
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
      setError(null);

      // Set demo data for now since backend might not be fully connected
      setDashboardData({
        financialMetrics: {
          revenue: 15420.50,
          expenses: 8200.30,
          profit: 7220.20,
          outstandingInvoices: 2840.00,
          cashFlow: 12580.50,
          ordersCount: 125,
          month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        },
        recentOrders: [
          { orderId: 'ORD-001', customer_name: 'John Doe', status: 'In_Production', total: 250.00 },
          { orderId: 'ORD-002', customer_name: 'Jane Smith', status: 'Completed', total: 180.50 },
          { orderId: 'ORD-003', customer_name: 'Bob Wilson', status: 'Pending', total: 320.75 }
        ],
        upcomingDeliveries: [
          { deliveryId: 'DEL-001', customer: { name: 'ABC Corp' }, scheduledDate: new Date(Date.now() + 86400000) },
          { deliveryId: 'DEL-002', customer: { name: 'XYZ Ltd' }, scheduledDate: new Date(Date.now() + 172800000) }
        ],
        productionData: {
          inProduction: 15,
          completed: 89,
          pending: 23,
          qualityCheck: 5
        },
        hrMetrics: {
          totalEmployees: 12,
          activeEmployees: 11,
          todayAttendance: 9,
          attendanceRate: 81.8
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Using demo data.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In_Production': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || user?.email || 'User'}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your business today.
            </p>
          </div>
          <Button onClick={fetchDashboardData}>
            Refresh Data
          </Button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${dashboardData.financialMetrics?.revenue?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.financialMetrics?.month}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${dashboardData.financialMetrics?.profit?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Revenue minus expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.financialMetrics?.ordersCount || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Attendance</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.hrMetrics?.attendanceRate || '0'}%
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.hrMetrics?.todayAttendance} of {dashboardData.hrMetrics?.activeEmployees} present
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow</CardTitle>
              <CardDescription>Current month overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-4">
                ${dashboardData.financialMetrics?.cashFlow?.toLocaleString() || '0'}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="text-sm font-medium text-green-600">
                    +${dashboardData.financialMetrics?.revenue?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Expenses</span>
                  <span className="text-sm font-medium text-red-600">
                    -${dashboardData.financialMetrics?.expenses?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outstanding Invoices</CardTitle>
              <CardDescription>Pending payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                ${dashboardData.financialMetrics?.outstandingInvoices?.toLocaleString() || '0'}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Follow up with customers for timely payments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="deliveries">Upcoming Deliveries</TabsTrigger>
            <TabsTrigger value="production">Production Status</TabsTrigger>
            <TabsTrigger value="hr">HR Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest customer orders and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentOrders?.map((order, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{order.orderId}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm font-medium mt-1">${order.total?.toFixed(2)}</p>
                      </div>
                    </div>
                  )) || <p className="text-muted-foreground">No recent orders</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deliveries</CardTitle>
                <CardDescription>Scheduled deliveries for the next few days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.upcomingDeliveries?.map((delivery, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{delivery.deliveryId}</p>
                        <p className="text-sm text-muted-foreground">{delivery.customer?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(delivery.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )) || <p className="text-muted-foreground">No upcoming deliveries</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="production" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Production Overview</CardTitle>
                <CardDescription>Current production status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {dashboardData.productionData?.pending || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardData.productionData?.inProduction || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">In Production</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {dashboardData.productionData?.qualityCheck || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Quality Check</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.productionData?.completed || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hr" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>HR Summary</CardTitle>
                <CardDescription>Employee and attendance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Employee Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Employees</span>
                        <span className="font-medium">{dashboardData.hrMetrics?.totalEmployees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active</span>
                        <span className="font-medium text-green-600">{dashboardData.hrMetrics?.activeEmployees}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Today's Attendance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Present</span>
                        <span className="font-medium text-green-600">{dashboardData.hrMetrics?.todayAttendance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Attendance Rate</span>
                        <span className="font-medium">{dashboardData.hrMetrics?.attendanceRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
