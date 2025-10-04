'use client';
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, Receipt, FileText } from "lucide-react";
import api from '../services/api';

export default function FinancePage() {
    const [expenses, setExpenses] = useState([]);
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
            
            // Fetch expenses and orders
            const [expensesRes, ordersRes] = await Promise.all([
                api.get('/finance/expenses'),
                api.get('/orders')
            ]);
            
            setExpenses(expensesRes.data || []);
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
                                <div className="text-2xl font-bold">Rs. {orders
                                            .filter(order => order.status === 'Completed')
                                            .reduce((sum, order) => sum + (order.total || 0), 0)
                                            .toFixed(2)
                                            }</div>
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
                                <div className="text-2xl font-bold">Rs. {expenses
                                    .reduce((sum, expense) => sum + (expense.amount || 0), 0)
                                    .toFixed(2)
                                }</div>
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
                                {(() => {
                                    const totalRevenue = orders
                                        .filter(order => order.status === 'Completed')
                                        .reduce((sum, order) => sum + (order.total || 0), 0);
                                    const totalExpenses = expenses
                                        .reduce((sum, expense) => sum + (expense.amount || 0), 0);
                                    const netProfit = totalRevenue - totalExpenses;
                                    
                                    return (
                                        <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            Rs. {netProfit.toFixed(2)}
                                        </div>
                                    );
                                })()}
                                <p className="text-xs text-muted-foreground">
                                    Revenue minus expenses
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    const totalRevenue = orders
                                        .filter(order => order.status === 'Completed')
                                        .reduce((sum, order) => sum + (order.total || 0), 0);
                                    const totalExpenses = expenses
                                        .reduce((sum, expense) => sum + (expense.amount || 0), 0);
                                    const netProfit = totalRevenue - totalExpenses;
                                    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;
                                    
                                    return (
                                        <div className="text-2xl font-bold">
                                            {profitMargin.toFixed(1)}%
                                        </div>
                                    );
                                })()}
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

                   
                    {/* Revenue Tab */}
                    <TabsContent value="revenue" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Revenue Management</h2>
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
