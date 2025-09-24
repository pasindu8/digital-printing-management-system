'use client';
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, Plus, Receipt, CreditCard, FileText } from "lucide-react";
import api from '../services/api';

export default function FinancePage() {
    const [expenses, setExpenses] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [orders, setOrders] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        try {
            setLoading(true);
            
            // Fetch expenses, invoices, and orders
            const [expensesRes, invoicesRes, ordersRes] = await Promise.all([
                api.get('/finance/expenses'),
                api.get('/finance/invoices'),
                api.get('/orders')
            ]);
            
            setExpenses(expensesRes.data || []);
            setInvoices(invoicesRes.data || []);
            setOrders(ordersRes.data || []);
            
            // Try to fetch summary, but don't fail if it doesn't work
            try {
                const summaryRes = await api.get(`/finance/summary/${new Date().getFullYear()}/${new Date().getMonth() + 1}`);
                setSummary(summaryRes.data);
            } catch (summaryErr) {
                console.warn('Summary not available:', summaryErr);
                // Set default summary
                setSummary({
                    revenue: { total: 0 },
                    expenses: { total: 0 },
                    netProfit: 0
                });
            }
            
            setError(null);
        } catch (err) {
            console.error('Error fetching finance data:', err);
            setError('Failed to load finance data');
        } finally {
            setLoading(false);
        }
    };

    const generateInvoice = async (orderId) => {
        try {
            setLoading(true);
            const response = await api.post(`/finance/generate-invoice/${orderId}`);
            
            // Show success message with invoice details
            alert(`Invoice generated successfully!\n\nInvoice ID: ${response.data.invoiceId}\nCustomer: ${response.data.customer.name}\nTotal: Rs. ${response.data.total.toFixed(2)}\nStatus: ${response.data.status}`);
            
            // Refresh the finance data to show any new expenses that might have been created
            await fetchFinanceData();
            
        } catch (err) {
            console.error('Error generating invoice:', err);
            
            // Provide specific error messages
            const errorMessage = err.response?.data?.message || 'Failed to generate invoice';
            alert(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                        <p className="mt-4 text-gray-600">Loading finance data...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={fetchFinanceData}>Try Again</Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Finance Management</h1>
                        <p className="text-muted-foreground">
                            Manage expenses and financial reports
                        </p>
                    </div>
                </div>

                {/* Financial Summary Cards */}
                {summary && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Rs. {summary.revenue?.total?.toFixed(2) || '0.00'}</div>
                                <p className="text-xs text-muted-foreground">
                                    From completed orders
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Rs. {summary.expenses?.total?.toFixed(2) || '0.00'}</div>
                                <p className="text-xs text-muted-foreground">
                                    Operational expenses
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${summary.netProfit?.toFixed(2) || '0.00'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    This month
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {summary.revenue?.total > 0 
                                        ? ((summary.netProfit / summary.revenue.total) * 100).toFixed(1)
                                        : '0.0'
                                    }%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Profit percentage
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabs for different sections */}
                <Tabs defaultValue="expenses" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="expenses">Expenses</TabsTrigger>
                        <TabsTrigger value="invoices">Invoices</TabsTrigger>
                        <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    </TabsList>

                    {/* Expenses Tab */}
                    <TabsContent value="expenses" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Expenses</h2>
                            <div className="text-sm text-muted-foreground">
                                Expenses are automatically added from material orders and salaries
                            </div>
                        </div>
                        
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.map((expense) => (
                                        <TableRow key={expense._id}>
                                            <TableCell>
                                                {new Date(expense.date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>{expense.category}</TableCell>
                                            <TableCell>{expense.description}</TableCell>
                                            <TableCell>Rs. {expense.amount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant={expense.status === 'Paid' ? 'default' : 'secondary'}>
                                                    {expense.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Invoices Tab */}
                    <TabsContent value="invoices" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Invoice Management</h2>
                        </div>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Auto-Generate Invoices</CardTitle>
                                <CardDescription>
                                    Automatically generate invoices for completed orders
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Invoices are automatically generated when orders are marked as completed.
                                    You can also manually generate invoices for specific orders.
                                </p>
                                <Button onClick={() => generateInvoice('ORD-001')}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Generate Sample Invoice
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Generated Invoices List */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice ID</TableHead>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Subtotal</TableHead>
                                        <TableHead>Tax</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Due Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                                                No invoices generated yet. Click "Generate Sample Invoice" to create one.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        invoices.map((invoice) => (
                                            <TableRow key={invoice._id}>
                                                <TableCell className="font-medium">{invoice.invoiceId}</TableCell>
                                                <TableCell>{invoice.orderId}</TableCell>
                                                <TableCell>{invoice.customer.name}</TableCell>
                                                <TableCell>Rs. {invoice.subtotal.toFixed(2)}</TableCell>
                                                <TableCell>Rs. {invoice.tax.toFixed(2)}</TableCell>
                                                <TableCell className="font-medium">Rs. {invoice.total.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={invoice.status === 'Paid' ? 'default' : 'secondary'}>
                                                        {invoice.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Revenue Tab */}
                    <TabsContent value="revenue" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Revenue Management</h2>
                        </div>
                        
                        {/* Revenue Summary Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        Rs. {orders
                                            .filter(order => order.status === 'Completed')
                                            .reduce((sum, order) => sum + (order.total || 0), 0)
                                            .toFixed(2)
                                        }
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        From completed orders
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
                                    <Receipt className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        Rs. {orders
                                            .filter(order => order.status === 'Pending' || order.status === 'In Progress')
                                            .reduce((sum, order) => sum + (order.total || 0), 0)
                                            .toFixed(2)
                                        }
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        From pending orders
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        Rs. {orders.length > 0 
                                            ? (orders.reduce((sum, order) => sum + (order.total || 0), 0) / orders.length).toFixed(2)
                                            : '0.00'
                                        }
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        All orders average
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
                                        {orders.length}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {orders.filter(order => order.status === 'Completed').length} completed
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Revenue by Customer */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue by Customer</CardTitle>
                                <CardDescription>
                                    Breakdown of revenue by customer from all orders
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Total Orders</TableHead>
                                                <TableHead>Completed Orders</TableHead>
                                                <TableHead>Pending Orders</TableHead>
                                                <TableHead>Total Revenue</TableHead>
                                                <TableHead>Completed Revenue</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {orders.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                                        No order data available. Create some orders to see revenue statistics.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                // Group orders by customer
                                                Object.entries(
                                                    orders.reduce((acc, order) => {
                                                        const customerName = order.customer_name || 'Unknown Customer';
                                                        if (!acc[customerName]) {
                                                            acc[customerName] = {
                                                                totalOrders: 0,
                                                                completedOrders: 0,
                                                                pendingOrders: 0,
                                                                totalRevenue: 0,
                                                                completedRevenue: 0
                                                            };
                                                        }
                                                        acc[customerName].totalOrders += 1;
                                                        acc[customerName].totalRevenue += order.total || 0;
                                                        
                                                        if (order.status === 'Completed') {
                                                            acc[customerName].completedOrders += 1;
                                                            acc[customerName].completedRevenue += order.total || 0;
                                                        } else if (order.status === 'Pending' || order.status === 'In Progress') {
                                                            acc[customerName].pendingOrders += 1;
                                                        }
                                                        
                                                        return acc;
                                                    }, {})
                                                ).map(([customerName, data]) => (
                                                    <TableRow key={customerName}>
                                                        <TableCell className="font-medium">{customerName}</TableCell>
                                                        <TableCell>{data.totalOrders}</TableCell>
                                                        <TableCell>{data.completedOrders}</TableCell>
                                                        <TableCell>{data.pendingOrders}</TableCell>
                                                        <TableCell>Rs. {data.totalRevenue.toFixed(2)}</TableCell>
                                                        <TableCell className="font-medium">Rs. {data.completedRevenue.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
