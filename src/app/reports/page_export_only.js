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

        {/* Export Section */}
        <Tabs defaultValue="export" className="space-y-4">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

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