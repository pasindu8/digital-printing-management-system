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
import { BarChart3, Download, FileText, PieChart, Loader2 } from "lucide-react";

export default function Reports() {
  const [dateRange, setDateRange] = useState("last-30-days");
  const [reports, setReports] = useState({
    overview: null,
    sales: null,
    production: null,
    delivery: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch all reports data
      const [overviewRes, salesRes, productionRes, deliveryRes] = await Promise.all([
        fetch('http://localhost:5000/api/reports/overview'),
        fetch('http://localhost:5000/api/reports/sales'),
        fetch('http://localhost:5000/api/reports/production'),
        fetch('http://localhost:5000/api/reports/delivery')
      ]);

      const overview = await overviewRes.json();
      const sales = await salesRes.json();
      const production = await productionRes.json();
      const delivery = await deliveryRes.json();

      setReports({
        overview,
        sales,
        production,
        delivery
      });
    } catch (err) {
      setError('Failed to fetch reports data');
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
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
                  Rs. {reports.overview?.totalRevenue?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total across all sales
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.overview?.totalOrders || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  All time orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.overview?.totalCustomers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total customers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.delivery?.pendingDeliveries || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting delivery
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest order activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reports.overview?.recentOrders?.map((order, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <p className="font-medium">Order #{order.orderId}</p>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Rs. {order.totalAmount}</p>
                        <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )) || <p className="text-gray-500">No recent orders</p>}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Latest billing activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reports.overview?.recentInvoices?.map((invoice, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">{invoice.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Rs. {invoice.totalAmount}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  )) || <p className="text-gray-500">No recent invoices</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rs. {reports.sales?.totalRevenue?.toLocaleString() || '0'}
                </div>
                <p className="text-sm text-gray-600">
                  From {reports.sales?.totalOrders || 0} orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rs. {reports.sales?.averageOrderValue?.toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reports.sales?.ordersByStatus?.map((status, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="capitalize">{status._id}</span>
                      <span className="font-medium">{status.count}</span>
                    </div>
                  )) || <p className="text-gray-500">No data available</p>}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Latest completed orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports.sales?.recentSales?.map((sale, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">Order #{sale.orderId}</p>
                      <p className="text-sm text-gray-600">{sale.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rs. {sale.totalAmount}</p>
                      <p className="text-sm text-gray-600">{new Date(sale.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )) || <p className="text-gray-500">No recent sales</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Production Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.production?.totalProductionOrders || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Completed Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.production?.completedOrders || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.production?.inProgressOrders || 0}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Production by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports.production?.ordersByStatus?.map((status, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="capitalize">{status._id}</span>
                    <span className="font-medium">{status.count}</span>
                  </div>
                )) || <p className="text-gray-500">No data available</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Raw Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.inventory?.totalRawMaterials || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {reports.inventory?.lowStockItems || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Inventory Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rs. {reports.inventory?.totalInventoryValue?.toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports.inventory?.materials?.map((material, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">{material.materialName}</p>
                      <p className="text-sm text-gray-600">{material.supplier}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{material.quantity} {material.unit}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        material.quantity > 50 ? 'bg-green-100 text-green-800' :
                        material.quantity > 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {material.quantity > 50 ? 'In Stock' : 
                         material.quantity > 10 ? 'Low Stock' : 'Critical'}
                      </span>
                    </div>
                  </div>
                )) || <p className="text-gray-500">No inventory data</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.delivery?.totalDeliveries || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {reports.delivery?.pendingDeliveries || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>In Transit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {reports.delivery?.inTransitDeliveries || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Delivered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reports.delivery?.deliveredCount || 0}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports.delivery?.recentDeliveries?.map((delivery, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">Tracking: {delivery.trackingNumber}</p>
                      <p className="text-sm text-gray-600">{delivery.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{delivery.address}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        delivery.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                        delivery.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {delivery.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                )) || <p className="text-gray-500">No recent deliveries</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
