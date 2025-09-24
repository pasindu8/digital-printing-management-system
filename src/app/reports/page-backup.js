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
  PieChart, 
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
        case 'last-90-days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'this-year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      endDate = now;
      
      const dateParams = `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      
      // Fetch all reports data
      const [overviewRes, salesRes, productionRes, inventoryRes, deliveryRes] = await Promise.all([
        fetch(`http://localhost:5000/api/reports/overview${dateParams}`),
        fetch(`http://localhost:5000/api/reports/sales${dateParams}`),
        fetch(`http://localhost:5000/api/reports/production${dateParams}`),
        fetch(`http://localhost:5000/api/reports/inventory`), // Inventory doesn't need date filter
        fetch(`http://localhost:5000/api/reports/delivery${dateParams}`)
      ]);

      // Check if all responses are ok
      if (!overviewRes.ok || !salesRes.ok || !productionRes.ok || !inventoryRes.ok || !deliveryRes.ok) {
        throw new Error('One or more API requests failed');
      }

      const overview = await overviewRes.json();
      const sales = await salesRes.json();
      const production = await productionRes.json();
      const inventory = await inventoryRes.json();
      const delivery = await deliveryRes.json();

      setReports({
        overview,
        sales,
        production,
        inventory,
        delivery
      });
    } catch (err) {
      setError('Failed to fetch reports data. Please ensure the backend server is running.');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading reports...</span>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchReports}>Retry</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 Days</SelectItem>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="last-90-days">Last 90 Days</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(reports.overview?.revenue?.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reports.overview?.revenue?.totalInvoices || 0} invoices
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.overview?.orders?.totalOrders || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg: {formatCurrency(reports.overview?.orders?.avgOrderValue)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Production Time</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.overview?.production?.totalProductionTime?.toFixed(1) || '0'} hrs
                </div>
                <p className="text-xs text-muted-foreground">
                  {reports.overview?.production?.totalJobs || 0} jobs completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.overview?.customers?.newCustomers || '0'}
                </div>
                <p className="text-xs text-muted-foreground">This period</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] rounded-md bg-gray-100 flex items-center justify-center">
                  Revenue Chart Placeholder
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Order Distribution</CardTitle>
                <CardDescription>By product type</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] rounded-md bg-gray-100 flex items-center justify-center">
                  Order Distribution Chart Placeholder
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Production Efficiency</CardTitle>
              <CardDescription>Machine utilization and output</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] rounded-md bg-gray-100 flex items-center justify-center">
                Production Efficiency Chart Placeholder
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Analysis</CardTitle>
              <CardDescription>Detailed breakdown of sales performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-[300px] rounded-md bg-gray-100 flex items-center justify-center">
                  Sales Trend Chart Placeholder
                </div>
                <div className="h-[300px] rounded-md bg-gray-100 flex items-center justify-center">
                  Customer Segment Chart Placeholder
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Top Customers</h3>
                <div className="space-y-2">
                  {reports.sales?.topCustomers?.slice(0, 5).map((customer, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{customer._id}</span>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(customer.totalRevenue)}</div>
                        <div className="text-sm text-gray-500">{customer.orderCount} orders</div>
                      </div>
                    </div>
                  )) || <div className="text-gray-500">No customer data available</div>}
                </div>
                
                <h3 className="text-lg font-medium mb-2 mt-4">Sales by Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {reports.sales?.salesByStatus?.map((status, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-muted-foreground">{status._id}</p>
                      <p className="text-xl font-bold">{status.count}</p>
                      <p className="text-sm">{formatCurrency(status.totalAmount)}</p>
                    </div>
                  )) || <div className="text-gray-500">No sales status data available</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Production Analytics</CardTitle>
              <CardDescription>Production metrics and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="col-span-2 h-[300px] rounded-md bg-gray-100 flex items-center justify-center">
                  Production Timeline Chart Placeholder
                </div>
                <div className="h-[300px] rounded-md bg-gray-100 flex items-center justify-center">
                  Machine Utilization Chart Placeholder
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Key Production Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Avg. Production Time</p>
                    <p className="text-xl font-bold">
                      {reports.production?.efficiency?.[0]?.avgProductionTime?.toFixed(1) || '0'} hrs
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">On-time Completion</p>
                    <p className="text-xl font-bold">
                      {((reports.production?.efficiency?.[0]?.onTimeCompletion || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Total Jobs</p>
                    <p className="text-xl font-bold">
                      {reports.production?.efficiency?.[0]?.totalJobs || '0'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Completed Jobs</p>
                    <p className="text-xl font-bold">
                      {reports.production?.efficiency?.[0]?.completedJobs || '0'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Analysis</CardTitle>
              <CardDescription>Stock levels and material usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-[300px] rounded-md bg-gray-100 flex items-center justify-center">
                  Inventory Levels Chart Placeholder
                </div>
                <div className="h-[300px] rounded-md bg-gray-100 flex items-center justify-center">
                  Material Usage Chart Placeholder
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Inventory Health</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Items Low on Stock</p>
                    <p className="text-xl font-bold">
                      {reports.inventory?.lowStockItems || '0'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Overstocked Items</p>
                    <p className="text-xl font-bold">
                      {reports.inventory?.overstockedItems || '0'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Inventory Value</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(reports.inventory?.inventoryValue?.totalValue)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-xl font-bold">
                      {reports.inventory?.inventoryValue?.totalItems || '0'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Material Usage (Top 10)</h3>
                  <div className="space-y-2">
                    {reports.inventory?.materialUsage?.slice(0, 5).map((material, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">Material ID: {material._id}</span>
                        <div className="text-right">
                          <div className="font-bold">{material.totalOrdered} units</div>
                          <div className="text-sm text-gray-500">{material.orderCount} orders</div>
                        </div>
                      </div>
                    )) || <div className="text-gray-500">No material usage data available</div>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}