'use client';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
    Dialog,
    DialogContent,
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
import { DollarSign, TrendingUp, TrendingDown, Receipt, FileText, Menu } from "lucide-react";
import { Sidebar } from '@/components/layout/sidebar';
import api from '../services/api';

export default function FinancePage() {
    const [expenses, setExpenses] = useState([]);
    const [orders, setOrders] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserName, setCurrentUserName] = useState("System");
    const createInitialExpense = () => ({
        date: new Date().toISOString().split('T')[0],
        category: "",
        description: "",
        amount: "",
        status: "Pending",
    });
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [newExpense, setNewExpense] = useState(createInitialExpense);
    const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
    const [expenseError, setExpenseError] = useState("");

    const expenseCategories = [
        "Materials",
        "Equipment",
        "Utilities",
        "Rent",
        "Salaries",
        "Marketing",
        "Maintenance",
        "Other",
    ];
    const expenseStatuses = ["Pending", "Approved", "Paid"];

    // Sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state
    const [sidebarMinimized, setSidebarMinimized] = useState(false); // Desktop sidebar minimize state

    // Sidebar functions
    const toggleSidebar = () => { setSidebarOpen(!sidebarOpen); };
    const toggleMinimize = () => { setSidebarMinimized(!sidebarMinimized); };

    useEffect(() => {
        fetchFinanceData();
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                if (parsed?.name) {
                    setCurrentUserName(parsed.name);
                }
            }
        } catch (storageError) {
            console.warn("Failed to load current user for expenses dialog:", storageError);
        }
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

    const handleDialogOpenChange = (open) => {
        setIsExpenseDialogOpen(open);
        if (!open) {
            setExpenseError("");
        }
    };

    const handleOpenExpenseDialog = () => {
        setNewExpense(createInitialExpense());
        handleDialogOpenChange(true);
    };

    const handleExpenseSubmit = async () => {
        if (!newExpense.date || !newExpense.category || !newExpense.description || newExpense.amount === "" || !newExpense.status) {
            setExpenseError("Please fill in all required fields.");
            return;
        }

        const amountValue = Number(newExpense.amount);
        if (!Number.isFinite(amountValue) || amountValue <= 0) {
            setExpenseError("Amount must be greater than zero.");
            return;
        }

        setIsSubmittingExpense(true);
        try {
            const payload = {
                date: new Date(newExpense.date).toISOString(),
                category: newExpense.category,
                description: newExpense.description,
                amount: amountValue,
                status: newExpense.status,
                paymentMethod: 'Cash',
                createdBy: currentUserName || 'Manual Entry',
            };

            const response = await api.post('/finance/expenses', payload);
            const savedExpense = response.data;

            setExpenses((prev) => {
                const updated = [savedExpense, ...prev];
                return updated.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            });

            setNewExpense(createInitialExpense());
            handleDialogOpenChange(false);
        } catch (err) {
            console.error('Failed to add expense:', err);
            setExpenseError('Failed to add expense. Please try again.');
        } finally {
            setIsSubmittingExpense(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#049532] border-t-transparent absolute top-0 left-0"></div>
                    </div>
                    <p className="text-lg text-gray-700 font-medium">Loading finance data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <TrendingDown className="h-16 w-16 text-red-500 mx-auto" />
                    <p className="text-red-600 text-lg font-medium">{error}</p>
                    <Button 
                        onClick={fetchFinanceData}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                        Try Again
                    </Button>
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
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content Area - Adjusts width instead of being pushed */}
            <div className={`flex-1 transition-all duration-300 ${sidebarMinimized ? 'lg:ml-16' : 'lg:ml-64'}`}>
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            {/* Logo */}
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
                                    <p className="text-xs text-gray-600">Finance Management</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="space-y-6">

                        {/* Modern Header with Glassmorphism */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 via-emerald-600/10 to-teal-600/10 rounded-3xl blur-3xl"></div>
                            <div className="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg">
                                        <DollarSign className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                            Finance Management
                                        </h1>
                                        <p className="text-xl text-slate-600 mt-2">
                                            Manage expenses and financial reports
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Modern Financial Summary Cards */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <div className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-700">Total Revenue</CardTitle>
                                        <DollarSign className="h-4 w-4 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent>
                                        {(() => {
                                            const getOrderRevenue = (order) => Number(order?.final_amount ?? order?.total ?? 0);
                                            const totalRevenue = orders
                                                .filter(order => (order.payment_status || '').toLowerCase() === 'paid')
                                                .reduce((sum, order) => sum + getOrderRevenue(order), 0);
                                            return (
                                                <>
                                                    <div className="text-2xl font-bold text-slate-800">Rs. {totalRevenue.toFixed(2)}</div>
                                                    <p className="text-xs text-slate-500">From paid orders</p>
                                                </>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-700">Total Expenses</CardTitle>
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    </CardHeader>
                                    <CardContent>
                                        {(() => {
                                            const totalExpensesValue = expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
                                            return (
                                                <>
                                                    <div className="text-2xl font-bold text-slate-800">Rs. {totalExpensesValue.toFixed(2)}</div>
                                                    <p className="text-xs text-slate-500">Operational expenses</p>
                                                </>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-700">Net Profit</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-blue-600" />
                                    </CardHeader>
                                    <CardContent>
                                        {(() => {
                                            const getOrderRevenue = (order) => Number(order?.final_amount ?? order?.total ?? 0);
                                            const totalRevenue = orders
                                                .filter(order => (order.payment_status || '').toLowerCase() === 'paid')
                                                .reduce((sum, order) => sum + getOrderRevenue(order), 0);
                                            const totalExpenses = expenses
                                                .reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
                                            const netProfit = totalRevenue - totalExpenses;
                                            
                                            return (
                                                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                                                    Rs. {netProfit.toFixed(2)}
                                                </div>
                                            );
                                        })()}
                                        <p className="text-xs text-slate-500">Revenue minus expenses</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-700">Profit Margin</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-purple-600" />
                                    </CardHeader>
                                    <CardContent>
                                        {(() => {
                                            const getOrderRevenue = (order) => Number(order?.final_amount ?? order?.total ?? 0);
                                            const totalRevenue = orders
                                                .filter(order => (order.payment_status || '').toLowerCase() === 'paid')
                                                .reduce((sum, order) => sum + getOrderRevenue(order), 0);
                                            const totalExpenses = expenses
                                                .reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
                                            const netProfit = totalRevenue - totalExpenses;
                                            const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;
                                            
                                            return (
                                                <div className="text-2xl font-bold text-slate-800">
                                                    {profitMargin.toFixed(1)}%
                                                </div>
                                            );
                                        })()}
                                        <p className="text-xs text-slate-500">Profit percentage</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Modern Tabs Section */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-green-50/50 rounded-2xl blur-xl"></div>
                            <Tabs defaultValue="expenses" className="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6">
                                <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl p-1">
                                    <TabsTrigger value="expenses" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-600 rounded-lg transition-all duration-300">
                                        <Receipt className="h-4 w-4 mr-2" />
                                        Expenses
                                    </TabsTrigger>
                                    <TabsTrigger value="revenue" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-600 rounded-lg transition-all duration-300">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Revenue
                                    </TabsTrigger>
                                </TabsList>

                    {/* Expenses Tab */}
                    <TabsContent value="expenses" className="space-y-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Expenses</h2>
                                <p className="text-sm text-muted-foreground">
                                    Log manual expenses or review automated entries from material orders and payroll.
                                </p>
                            </div>
                            <Button
                                onClick={handleOpenExpenseDialog}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                            >
                                Add Expense
                            </Button>
                        </div>

                        <Dialog open={isExpenseDialogOpen} onOpenChange={handleDialogOpenChange}>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Add Expense</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    {expenseError && (
                                        <p className="text-sm text-red-600">{expenseError}</p>
                                    )}
                                    <div className="grid gap-2">
                                        <Label htmlFor="expense-date">Date</Label>
                                        <Input
                                            id="expense-date"
                                            type="date"
                                            value={newExpense.date}
                                            onChange={(event) => {
                                                setExpenseError("");
                                                setNewExpense((prev) => ({ ...prev, date: event.target.value }));
                                            }}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="expense-category">Category</Label>
                                        <Select
                                            value={newExpense.category}
                                            onValueChange={(value) => {
                                                setExpenseError("");
                                                setNewExpense((prev) => ({ ...prev, category: value }));
                                            }}
                                        >
                                            <SelectTrigger id="expense-category">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {expenseCategories.map((category) => (
                                                    <SelectItem key={category} value={category}>
                                                        {category}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="expense-description">Description</Label>
                                        <Textarea
                                            id="expense-description"
                                            value={newExpense.description}
                                            onChange={(event) => {
                                                setExpenseError("");
                                                setNewExpense((prev) => ({ ...prev, description: event.target.value }));
                                            }}
                                            rows={3}
                                            placeholder="Describe the expense"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="expense-amount">Amount</Label>
                                        <Input
                                            id="expense-amount"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={newExpense.amount}
                                            onChange={(event) => {
                                                setExpenseError("");
                                                setNewExpense((prev) => ({ ...prev, amount: event.target.value }));
                                            }}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="expense-status">Status</Label>
                                        <Select
                                            value={newExpense.status}
                                            onValueChange={(value) => {
                                                setExpenseError("");
                                                setNewExpense((prev) => ({ ...prev, status: value }));
                                            }}
                                        >
                                            <SelectTrigger id="expense-status">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {expenseStatuses.map((status) => (
                                                    <SelectItem key={status} value={status}>
                                                        {status}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter className="gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleDialogOpenChange(false)}
                                        disabled={isSubmittingExpense}
                                    >
                                        Cancel
                                    </Button>
                                    <Button onClick={handleExpenseSubmit} disabled={isSubmittingExpense}>
                                        {isSubmittingExpense ? "Saving..." : "Save Expense"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

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
                                    {expenses.map((expense, index) => {
                                        const status = expense.status || "Pending";
                                        const normalizedStatus = status.toLowerCase();
                                        const badgeVariant = normalizedStatus === "paid" ? "default" : normalizedStatus === "pending" ? "secondary" : "outline";
                                        const amountValue = Number(expense.amount ?? 0);
                                        const formattedDate = expense.date ? new Date(expense.date).toLocaleDateString() : "-";

                                        return (
                                            <TableRow key={expense._id || expense.expenseId || index}>
                                                <TableCell>{formattedDate}</TableCell>
                                                <TableCell>{expense.category || "-"}</TableCell>
                                                <TableCell>{expense.description || "-"}</TableCell>
                                                <TableCell>Rs. {amountValue.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={badgeVariant}>
                                                        {status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
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
                                                        const getOrderRevenue = (currentOrder) => Number(currentOrder?.final_amount ?? currentOrder?.total ?? 0);
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
                                                        acc[customerName].totalRevenue += getOrderRevenue(order);
                                                        
                                                        const paymentStatus = (order.payment_status || '').toLowerCase();
                                                        if (paymentStatus === 'paid') {
                                                            acc[customerName].completedOrders += 1;
                                                            acc[customerName].completedRevenue += getOrderRevenue(order);
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
                    </div>
                </main>
            </div>
        </div>
    );
}
