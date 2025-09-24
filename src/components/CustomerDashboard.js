'use client';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Package,
    Truck,
    Settings,
    LogOut,
    Plus,
    Eye,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    User,
    Mail,
    Phone,
    MapPin,
    Download
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export default function CustomerDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newOrderOpen, setNewOrderOpen] = useState(false);

    // Helper function to download invoice
    const downloadInvoice = async (orderId) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${orderId}/invoice/download`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `Invoice_${orderId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Invoice not available for download');
            }
        } catch (error) {
            console.error('Error downloading invoice:', error);
            alert('Error downloading invoice');
        }
    };

    // Helper function to get payment status badge
    const getPaymentStatusBadge = (paymentStatus, paymentVerified) => {
        if (paymentVerified) {
            return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
        } else if (paymentStatus === 'paid') {
            return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
        } else {
            return <Badge className="bg-red-100 text-red-800">Pending Payment</Badge>;
        }
    };

    // Sample customer data
    useEffect(() => {
        // Simulate loading user data
        setTimeout(() => {
            setUser({
                name: "John Customer",
                email: "john@customer.com",
                phone: "+1 234 567 8900",
                company: "ABC Company",
                address: "123 Business St, City, State 12345"
            });

            setOrders([
                {
                    id: "ORD-001",
                    date: "2024-01-15",
                    status: "Processing",
                    items: "Business Cards (1000pcs)",
                    total: 2500,
                    estimatedDelivery: "2024-01-20",
                    paymentStatus: "paid",
                    paymentVerified: true,
                    invoiceAvailable: true,
                    customerEmail: "john@customer.com"
                },
                {
                    id: "ORD-002",
                    date: "2024-01-10",
                    status: "Delivered",
                    items: "Brochures (500pcs)",
                    total: 5000,
                    estimatedDelivery: "2024-01-15",
                    paymentStatus: "paid",
                    paymentVerified: true,
                    invoiceAvailable: true,
                    customerEmail: "john@customer.com"
                },
                {
                    id: "ORD-003",
                    date: "2024-01-05",
                    status: "In Production",
                    items: "Posters (50pcs)",
                    total: 3750,
                    estimatedDelivery: "2024-01-18",
                    paymentStatus: "paid",
                    paymentVerified: false,
                    invoiceAvailable: false,
                    rejectionReason: "Receipt quality unclear",
                    customerEmail: "john@customer.com"
                }
            ]);

            setDeliveries([
                {
                    id: "DEL-001",
                    orderId: "ORD-002",
                    status: "Delivered",
                    deliveryDate: "2024-01-15",
                    trackingNumber: "TRK123456789",
                    courier: "Express Delivery"
                },
                {
                    id: "DEL-002",
                    orderId: "ORD-001",
                    status: "In Transit",
                    estimatedDelivery: "2024-01-20",
                    trackingNumber: "TRK987654321",
                    courier: "Fast Courier"
                }
            ]);

            setLoading(false);
        }, 1000);
    }, []);

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return 'bg-emerald-100 text-emerald-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'processing':
            case 'in production':
                return 'bg-blue-100 text-blue-800';
            case 'in transit':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleLogout = () => {
        // Clear any stored auth tokens
        localStorage.removeItem('token');
        // Redirect to login
        window.location.href = '/login';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold text-gray-900">PrintShop Customer Portal</h1>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src="/placeholder-avatar.jpg" alt={user?.name} />
                                            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user?.name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setActiveTab("settings")}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleLogout}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="px-6 py-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="dashboard" className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Orders
                        </TabsTrigger>
                        <TabsTrigger value="delivery" className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Delivery
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    {/* Dashboard Tab */}
                    <TabsContent value="dashboard" className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{orders.length}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {orders.filter(order => order.status !== 'Delivered').length}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
                                    <Truck className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {deliveries.filter(delivery => delivery.status !== 'Delivered').length}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Orders</CardTitle>
                                    <CardDescription>Your latest printing orders</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {orders.slice(0, 3).map((order) => (
                                            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{order.id}</p>
                                                    <p className="text-sm text-gray-600">{order.items}</p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                                                    <p className="text-sm text-gray-600 mt-1">{formatCurrency(order.total)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                    <CardDescription>Common tasks and requests</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full justify-start">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Request New Quote
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Request a Quote</DialogTitle>
                                                <DialogDescription>
                                                    Tell us about your printing needs and we'll get back to you with a quote.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="product-type">Product Type</Label>
                                                    <Select>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select product type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="business-cards">Business Cards</SelectItem>
                                                            <SelectItem value="brochures">Brochures</SelectItem>
                                                            <SelectItem value="flyers">Flyers</SelectItem>
                                                            <SelectItem value="posters">Posters</SelectItem>
                                                            <SelectItem value="banners">Banners</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="quantity">Quantity</Label>
                                                    <Input id="quantity" placeholder="e.g., 1000" />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="specifications">Specifications</Label>
                                                    <Textarea 
                                                        id="specifications" 
                                                        placeholder="Size, paper type, colors, finishing, etc."
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="deadline">Required By</Label>
                                                    <Input id="deadline" type="date" />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" onClick={() => setNewOrderOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={() => {
                                                    alert('Quote request submitted! We will contact you soon.');
                                                    setNewOrderOpen(false);
                                                }}>
                                                    Submit Request
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                    
                                    <Button variant="outline" className="w-full justify-start">
                                        <Eye className="mr-2 h-4 w-4" />
                                        Track All Orders
                                    </Button>
                                    
                                    <Button variant="outline" className="w-full justify-start">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Download Invoices
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Orders Tab */}
                    <TabsContent value="orders" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Your Orders</h2>
                            <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        New Quote Request
                                    </Button>
                                </DialogTrigger>
                            </Dialog>
                        </div>

                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Payment</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Invoice/Email</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">{order.id}</TableCell>
                                                <TableCell>{order.date}</TableCell>
                                                <TableCell>{order.items}</TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(order.status)}>
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {getPaymentStatusBadge(order.paymentStatus, order.paymentVerified)}
                                                </TableCell>
                                                <TableCell>{formatCurrency(order.total)}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col space-y-1">
                                                        {order.invoiceAvailable && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                onClick={() => downloadInvoice(order.id)}
                                                                className="text-xs"
                                                            >
                                                                <Download className="h-3 w-3 mr-1" />
                                                                Invoice
                                                            </Button>
                                                        )}
                                                        <div className="flex items-center text-xs text-muted-foreground">
                                                            <Mail className="h-3 w-3 mr-1" />
                                                            {order.customerEmail}
                                                        </div>
                                                        {order.rejectionReason && (
                                                            <div className="text-xs text-red-600" title={order.rejectionReason}>
                                                                <AlertCircle className="h-3 w-3 mr-1 inline" />
                                                                Review Required
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Delivery Tab */}
                    <TabsContent value="delivery" className="space-y-6">
                        <h2 className="text-2xl font-bold">Delivery Tracking</h2>

                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tracking ID</TableHead>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Courier</TableHead>
                                            <TableHead>Delivery Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {deliveries.map((delivery) => (
                                            <TableRow key={delivery.id}>
                                                <TableCell className="font-medium">{delivery.trackingNumber}</TableCell>
                                                <TableCell>{delivery.orderId}</TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(delivery.status)}>
                                                        {delivery.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{delivery.courier}</TableCell>
                                                <TableCell>
                                                    {delivery.deliveryDate || delivery.estimatedDelivery}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="outline" size="sm">
                                                        Track
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-6">
                        <h2 className="text-2xl font-bold">Account Settings</h2>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Profile Information
                                    </CardTitle>
                                    <CardDescription>
                                        Update your personal and company details
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" defaultValue={user?.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="company">Company</Label>
                                        <Input id="company" defaultValue={user?.company} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input id="phone" defaultValue={user?.phone} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Textarea id="address" defaultValue={user?.address} />
                                    </div>
                                    <Button>Update Profile</Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="h-5 w-5" />
                                        Email & Security
                                    </CardTitle>
                                    <CardDescription>
                                        Manage your email and password settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" type="email" defaultValue={user?.email} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="current-password">Current Password</Label>
                                        <Input id="current-password" type="password" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <Input id="new-password" type="password" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                        <Input id="confirm-password" type="password" />
                                    </div>
                                    <Button>Update Security</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
