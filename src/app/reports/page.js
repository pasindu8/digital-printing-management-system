'use client';
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Download, 
  FileText, 
  PieChart as PieChartIcon, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  Truck,
  DollarSign,
  Calendar,
  Activity,
  AlertTriangle
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import api from "../services/api";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function Reports() {
  const [dateRange, setDateRange] = useState("last-30-days");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [productionData, setProductionData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [deliveryData, setDeliveryData] = useState(null);
  const [hrData, setHRData] = useState(null);
  const [financialData, setFinancialData] = useState(null);

  // Calculate date range based on selection
  const getDateParams = () => {
    const now = new Date();
    let startDate;
    
    switch(dateRange) {
      case 'last-7-days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last-30-days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last-90-days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return `?startDate=${startDate.toISOString()}&endDate=${now.toISOString()}`;
  };

  // Fetch all reports data
  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const dateParams = getDateParams();
      
      // Fetch all reports in parallel
      const [
        dashboardResponse,
        salesResponse,
        productionResponse,
        inventoryResponse,
        customerResponse,
        deliveryResponse,
        hrResponse,
        financialResponse
      ] = await Promise.allSettled([
        api.get(`/reports/dashboard-overview${dateParams}`),
        api.get(`/reports/sales-revenue${dateParams}`),
        api.get(`/reports/production${dateParams}`),
        api.get(`/reports/inventory`),
        api.get(`/reports/customers${dateParams}`),
        api.get(`/reports/delivery${dateParams}`),
        api.get(`/reports/hr`),
        api.get(`/reports/financial-summary${dateParams}`)
      ]);

      // Process responses
      if (dashboardResponse.status === 'fulfilled') {
        setDashboardData(dashboardResponse.value.data);
      }
      if (salesResponse.status === 'fulfilled') {
        setSalesData(salesResponse.value.data);
      }
      if (productionResponse.status === 'fulfilled') {
        setProductionData(productionResponse.value.data);
      }
      if (inventoryResponse.status === 'fulfilled') {
        setInventoryData(inventoryResponse.value.data);
      }
      if (customerResponse.status === 'fulfilled') {
        setCustomerData(customerResponse.value.data);
      }
      if (deliveryResponse.status === 'fulfilled') {
        setDeliveryData(deliveryResponse.value.data);
      }
      if (hrResponse.status === 'fulfilled') {
        setHRData(hrResponse.value.data);
      }
      if (financialResponse.status === 'fulfilled') {
        setFinancialData(financialResponse.value.data);
      }

    } catch (err) {
      setError('Failed to fetch reports data. Please ensure the backend server is running.');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [dateRange]);

  // Export report data
  const exportReport = (reportType) => {
    let data = [];
    let filename = '';
    
    switch (reportType) {
      case 'dashboard':
        data = dashboardData;
        filename = 'dashboard-overview';
        break;
      case 'sales':
        data = salesData;
        filename = 'sales-revenue-report';
        break;
      case 'production':
        data = productionData;
        filename = 'production-report';
        break;
      case 'inventory':
        data = inventoryData;
        filename = 'inventory-report';
        break;
      case 'customers':
        data = customerData;
        filename = 'customer-report';
        break;
      case 'delivery':
        data = deliveryData;
        filename = 'delivery-report';
        break;
      case 'hr':
        data = hrData;
        filename = 'hr-report';
        break;
      case 'financial':
        data = financialData;
        filename = 'financial-summary';
        break;
      default:
        return;
    }
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading reports data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchReportsData}>Retry</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive business insights across all operations
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={() => fetchReportsData()} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Dashboard Overview */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.financial?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {dashboardData.financial?.totalPaidOrders || 0} paid orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.customers || 0}</div>
                <p className="text-xs text-muted-foreground">Active customer base</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.orders?.reduce((sum, order) => sum + order.count, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg: {formatCurrency(dashboardData.financial?.avgOrderValue || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.inventory?.totalStockValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.inventory?.lowStock || 0} low stock items
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Visual Analytics Dashboard */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Business Analytics Dashboard</h2>
            <div className="text-sm text-muted-foreground">
              Real-time performance tracking and insights
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Revenue Trend Chart */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Monthly Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData?.salesTrends?.slice(-6) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="_id.month" 
                      formatter={(value, name, props) => `Month ${value}`}
                    />
                    <YAxis formatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      labelFormatter={(label) => `Month ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalSales" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="w-4 h-4 mr-2" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData?.orders || []}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={({_id, count}) => `${_id}: ${count}`}
                    >
                      {(dashboardData?.orders || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <div className="flex items-center">
                    <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                      <div 
                        className="h-2 bg-green-500 rounded-full" 
                        style={{
                          width: `${deliveryData?.onTimeRate ? 
                            Math.round((deliveryData.onTimeRate.onTimeDeliveries / deliveryData.onTimeRate.totalDeliveries) * 100) : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {deliveryData?.onTimeRate ? 
                        Math.round((deliveryData.onTimeRate.onTimeDeliveries / deliveryData.onTimeRate.totalDeliveries) * 100) : 0}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Customer Satisfaction</span>
                  <div className="flex items-center">
                    <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                      <div className="h-2 bg-blue-500 rounded-full" style={{width: '85%'}}></div>
                    </div>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Production Efficiency</span>
                  <div className="flex items-center">
                    <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                      <div className="h-2 bg-yellow-500 rounded-full" style={{width: '78%'}}></div>
                    </div>
                    <span className="text-sm font-medium">78%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Inventory Turnover</span>
                  <div className="flex items-center">
                    <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                      <div className="h-2 bg-purple-500 rounded-full" style={{width: '92%'}}></div>
                    </div>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row of Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Customer Acquisition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={customerData?.customerAcquisition?.slice(-6) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id.month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="newCustomers" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Products/Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Top Customers by Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {salesData?.topCustomers?.slice(0, 5).map((customer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[150px]">
                            {customer.customerName || 'Unknown Customer'}
                          </p>
                          <p className="text-xs text-muted-foreground">{customer.orderCount} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(customer.totalRevenue)}</p>
                        <div className="w-16 h-1 bg-gray-200 rounded-full">
                          <div 
                            className="h-1 bg-blue-500 rounded-full" 
                            style={{
                              width: `${Math.min((customer.totalRevenue / (salesData?.topCustomers?.[0]?.totalRevenue || 1)) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Inventory Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Inventory Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Materials</span>
                    <span className="font-medium">{dashboardData?.inventory?.totalMaterials || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low Stock Items</span>
                    <span className="font-medium text-red-600">{dashboardData?.inventory?.lowStock || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Value</span>
                    <span className="font-medium">{formatCurrency(dashboardData?.inventory?.totalStockValue || 0)}</span>
                  </div>

                  <div className="mt-4">
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={inventoryData?.stockValueByCategory?.slice(0, 3) || []}>
                        <Bar dataKey="totalValue" fill="#8884d8" />
                        <XAxis dataKey="_id" fontSize={10} />
                        <Tooltip formatter={(value) => [formatCurrency(value), 'Value']} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Production & Delivery Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Production Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productionData?.efficiencyMetrics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="w-4 h-4 mr-2" />
                  Delivery Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {deliveryData?.onTimeRate?.totalDeliveries > 0 ? 
                        Math.round((deliveryData.onTimeRate.onTimeDeliveries / deliveryData.onTimeRate.totalDeliveries) * 100) : 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">On-Time Delivery Rate</p>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={deliveryData?.deliveryMetrics || []}
                        dataKey="count"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                      >
                        {(deliveryData?.deliveryMetrics || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Reports Tabs */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8">
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="hr">HR</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Sales Report */}
          <TabsContent value="sales" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Sales & Revenue Report</h2>
              <Button onClick={() => exportReport('sales')} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Sales Data
              </Button>
            </div>
            
            {salesData ? (
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {salesData.paymentAnalysis?.map((payment, index) => (
                        <div key={index} className="flex justify-between items-center py-2">
                          <span className="capitalize">{payment._id}</span>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(payment.totalAmount)}</div>
                            <div className="text-sm text-muted-foreground">{payment.count} orders</div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {salesData.topCustomers?.slice(0, 5).map((customer, index) => (
                        <div key={index} className="flex justify-between items-center py-2">
                          <span>{customer.customerName || 'Unknown'}</span>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(customer.totalRevenue)}</div>
                            <div className="text-sm text-muted-foreground">{customer.orderCount} orders</div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sales Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {salesData.salesTrends?.slice(-5).map((trend, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm">
                              {trend._id.month}/{trend._id.day || trend._id.week}
                            </span>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(trend.totalSales)}</div>
                              <div className="text-xs text-muted-foreground">{trend.orderCount} orders</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <PieChartIcon className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No sales data available</p>
              </div>
            )}
          </TabsContent>

          {/* Production Report */}
          <TabsContent value="production" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Production Report</h2>
              <Button onClick={() => exportReport('production')} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Production Data
              </Button>
            </div>
            
            {productionData ? (
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Production Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {productionData.efficiencyMetrics?.map((metric, index) => (
                        <div key={index} className="flex justify-between items-center py-2">
                          <span className="capitalize">{metric._id}</span>
                          <div className="text-right">
                            <div className="font-medium">{metric.count} jobs</div>
                            <div className="text-sm text-muted-foreground">
                              Avg: {metric.avgTime?.toFixed(1) || 0}h
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Priority Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {productionData.priorityBreakdown?.map((priority, index) => (
                        <div key={index} className="flex justify-between items-center py-2">
                          <span className="capitalize">{priority._id}</span>
                          <div className="text-right">
                            <div className="font-medium">{priority.count} jobs</div>
                            <div className="text-sm text-muted-foreground">
                              Avg: {priority.avgCompletionTime?.toFixed(1) || 0}h
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No production data available</p>
              </div>
            )}
          </TabsContent>

          {/* Inventory Report */}
          <TabsContent value="inventory" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Inventory Report</h2>
              <Button onClick={() => exportReport('inventory')} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Inventory Data
              </Button>
            </div>
            
            {inventoryData ? (
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Low Stock Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {inventoryData.lowStockItems?.length > 0 ? (
                        inventoryData.lowStockItems.slice(0, 10).map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 text-red-600">
                            <span>{item.material_name}</span>
                            <div className="text-right">
                              <div>{item.current_stock} {item.unit_of_measurement}</div>
                              <div className="text-xs">Min: {item.minimum_stock_level}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No low stock items</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Stock Value by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {inventoryData.stockValueByCategory?.map((category, index) => (
                        <div key={index} className="flex justify-between items-center py-2">
                          <span className="capitalize">{category._id}</span>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(category.totalValue)}</div>
                            <div className="text-sm text-muted-foreground">{category.itemCount} items</div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Material Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {inventoryData.materialUsage?.map((usage, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span>{usage._id}</span>
                          <div className="text-right">
                            <div className="font-medium">{usage.totalUsed} units</div>
                            <div className="text-xs text-muted-foreground">{usage.usageCount} times</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No inventory data available</p>
              </div>
            )}
          </TabsContent>

          {/* Customer Report */}
          <TabsContent value="customers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Customer Report</h2>
              <Button onClick={() => exportReport('customers')} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Customer Data
              </Button>
            </div>
            
            {customerData ? (
              <div className="grid gap-6">
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Lifetime Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {customerData.customerLifetimeValue?.slice(0, 10).map((customer, index) => (
                        <div key={index} className="flex justify-between items-center py-2">
                          <span>{customer.customerName || 'Unknown Customer'}</span>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(customer.totalSpent)}</div>
                            <div className="text-sm text-muted-foreground">
                              {customer.totalOrders} orders • Avg: {formatCurrency(customer.avgOrderValue)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Acquisition Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {customerData.customerAcquisition?.slice(-6).map((acquisition, index) => (
                        <div key={index} className="flex justify-between items-center py-2">
                          <span>{acquisition._id.month}/{acquisition._id.year}</span>
                          <div className="font-medium">{acquisition.newCustomers} new customers</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No customer data available</p>
              </div>
            )}
          </TabsContent>

          {/* Delivery Report */}
          <TabsContent value="delivery" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Delivery Report</h2>
              <Button onClick={() => exportReport('delivery')} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Delivery Data
              </Button>
            </div>
            
            {deliveryData ? (
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Delivery Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {deliveryData.deliveryMetrics?.map((metric, index) => (
                        <div key={index} className="flex justify-between items-center py-2">
                          <span className="capitalize">{metric._id}</span>
                          <div className="text-right">
                            <div className="font-medium">{metric.count} deliveries</div>
                            {metric.avgDeliveryTime && (
                              <div className="text-sm text-muted-foreground">
                                Avg: {(metric.avgDeliveryTime / (1000 * 60 * 60 * 24)).toFixed(1)} days
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>On-Time Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {deliveryData.onTimeRate.totalDeliveries > 0 
                            ? ((deliveryData.onTimeRate.onTimeDeliveries / deliveryData.onTimeRate.totalDeliveries) * 100).toFixed(1)
                            : 0}%
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {deliveryData.onTimeRate.onTimeDeliveries} of {deliveryData.onTimeRate.totalDeliveries} on time
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Delivery by Area</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {deliveryData.deliveryByArea?.map((area, index) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <span>{area._id || 'Unknown Area'}</span>
                        <div className="text-right">
                          <div className="font-medium">{area.deliveryCount} deliveries</div>
                          <div className="text-sm text-muted-foreground">
                            Avg time: {area.avgDeliveryTime?.toFixed(1) || 0}h
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <Truck className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No delivery data available</p>
              </div>
            )}
          </TabsContent>

          {/* HR Report */}
          <TabsContent value="hr" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Human Resources Report</h2>
              <Button onClick={() => exportReport('hr')} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export HR Data
              </Button>
            </div>
            
            {hrData ? (
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Employee Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hrData.employeeStats?.map((stat, index) => (
                        <div key={index} className="flex justify-between items-center py-2">
                          <span className="capitalize">{stat._id}</span>
                          <div className="font-medium">{stat.count} employees</div>
                        </div>
                      ))}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Employees</span>
                          <div className="font-bold">
                            {hrData.employeeStats?.reduce((sum, stat) => sum + stat.count, 0) || 0}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {hrData.attendanceStats?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Attendance Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {hrData.attendanceStats.slice(-6).map((attendance, index) => (
                          <div key={index} className="flex justify-between items-center py-2">
                            <span>{attendance._id.month}/{attendance._id.year}</span>
                            <div className="text-right">
                              <div className="font-medium">
                                {((attendance.present / attendance.totalAttendance) * 100).toFixed(1)}%
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {attendance.present}/{attendance.totalAttendance}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No HR data available</p>
              </div>
            )}
          </TabsContent>

          {/* Financial Report */}
          <TabsContent value="financial" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Financial Summary</h2>
              <Button onClick={() => exportReport('financial')} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Financial Data
              </Button>
            </div>
            
            {financialData ? (
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(financialData.revenue?.totalRevenue || 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        From {financialData.revenue?.totalOrders || 0} paid orders
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(financialData.pendingPayments?.pendingAmount || 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        From {financialData.pendingPayments?.pendingOrders || 0} pending orders
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Inventory Investment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(financialData.materialCosts?.totalInventoryValue || 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total inventory value
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No financial data available</p>
              </div>
            )}
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <h2 className="text-2xl font-bold">Export Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    All Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => {
                      Object.keys({
                        dashboard: dashboardData,
                        sales: salesData,
                        production: productionData,
                        inventory: inventoryData,
                        customers: customerData,
                        delivery: deliveryData,
                        hr: hrData,
                        financial: financialData
                      }).forEach(reportType => {
                        if (eval(`${reportType}Data`)) {
                          exportReport(reportType);
                        }
                      });
                    }}
                    className="w-full"
                  >
                    Export All
                  </Button>
                </CardContent>
              </Card>

              {[
                { key: 'dashboard', name: 'Dashboard', icon: BarChart3, data: dashboardData },
                { key: 'sales', name: 'Sales', icon: TrendingUp, data: salesData },
                { key: 'production', name: 'Production', icon: Activity, data: productionData },
                { key: 'inventory', name: 'Inventory', icon: Package, data: inventoryData },
                { key: 'customers', name: 'Customers', icon: Users, data: customerData },
                { key: 'delivery', name: 'Delivery', icon: Truck, data: deliveryData },
                { key: 'hr', name: 'HR', icon: Users, data: hrData },
                { key: 'financial', name: 'Financial', icon: DollarSign, data: financialData }
              ].map(({ key, name, icon: Icon, data }) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Icon className="w-4 h-4 mr-2" />
                      {name} Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => exportReport(key)}
                      disabled={!data}
                      className="w-full"
                      variant={data ? "default" : "secondary"}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export {name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}