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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { Filter, MoreHorizontal, Plus, Search, AlertTriangle } from "lucide-react";
import api from '../services/api';
import { formatCurrency } from "@/lib/currency";
import { getCurrentUser } from "@/middleware/auth";

// Status badge component for consistent styling
const StatusBadge = ({ status }) => {
    let color;
    switch (status) {
        case "Pending":
            color = "bg-yellow-50 text-yellow-600 border-yellow-200";
            break;
        case "Confirmed":
            color = "bg-emerald-50 text-emerald-600 border-emerald-200";
            break;
        case "In Production":
            color = "bg-blue-50 text-blue-600 border-blue-200";
            break;
        case "Ready for Pickup":
            color = "bg-green-50 text-green-600 border-green-200";
            break;
        case "Completed":
            color = "bg-gray-50 text-gray-600 border-gray-200";
            break;
        default:
            color = "bg-gray-50 text-gray-600 border-gray-200";
    }
    return <Badge className={`border ${color}`}>{status}</Badge>;
};

// Helper function to get status order for tracking progress
const getStatusOrder = (status) => {
    const statusOrder = {
        'Pending': 0,
        'Confirmed': 1,
        'In_Production': 2,
        'Ready_for_Delivery': 3,
        'In_Transit': 4,
        'Delivered': 5,
        'Completed': 6
    };
    return statusOrder[status] || 0;
};

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
    const [trackingData, setTrackingData] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    
    // Assignment-related state
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [availableEmployees, setAvailableEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [assignmentLoading, setAssignmentLoading] = useState(false);
    const [orderToAssign, setOrderToAssign] = useState(null);

    const [isCustomer, setIsCustomer] = useState(false);
    const [showCreateButton, setShowCreateButton] = useState(false);
    const [isCustomerOrderDialogOpen, setIsCustomerOrderDialogOpen] = useState(false);
    
    // Payment receipt upload states
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [orderToPay, setOrderToPay] = useState(null);
    const [paymentReceipt, setPaymentReceipt] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState({
        bank: '',
        depositedAmount: '',
        branch: '',
        paymentDate: ''
    });

    useEffect(() => {
        // Get current user information
        const user = getCurrentUser();
        setCurrentUser(user);
        const customerRole = user && user.role === 'Customer';
        setIsCustomer(customerRole);
        setShowCreateButton(!customerRole); // Hide admin create button for customers
        
        // Debug logging
        console.log('Orders page - Current user:', user);
        console.log('Orders page - User role:', user?.role);
        console.log('Orders page - Is customer:', customerRole);
        
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const user = getCurrentUser();
            
            let response;
            if (user && user.role === 'Customer') {
                // For customers, fetch only their orders
                const customerEmail = user.email;
                response = await api.get(`/orders?customerEmail=${encodeURIComponent(customerEmail)}`);
            } else {
                // For admin/employees, fetch orders with verified receipts only
                // Orders without receipts are also shown, but orders with unverified receipts are hidden
                response = await api.get('/orders');
            }
            
            let ordersData = response.data;
            
            // Filter logic based on user role
            if (user && user.role === 'Customer') {
                // Additional client-side filtering for customers as a safety measure
                ordersData = ordersData.filter(order => {
                    // Filter by customer email or customer ID
                    return order.customerInfo?.email === user.email ||
                           order.customer?.email === user.email ||
                           order.customerEmail === user.email ||
                           order.customer_email === user.email ||
                           order.customer_name === user.name;
                });
            } else {
                // For admin/employees: hide orders with unverified receipts
                ordersData = ordersData.filter(order => {
                    // Show orders that:
                    // 1. Don't have a receipt (no payment_receipt.filename)
                    // 2. Have a verified receipt (payment_receipt.verified = true)
                    return !order.payment_receipt?.filename || order.payment_receipt?.verified === true;
                });
            }
            
            setOrders(ordersData);
            setError(null);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to load orders. Please make sure the backend server is running.');
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/${orderId}`, { 
                status: newStatus,
                tracking_notes: `Status updated to ${newStatus}`
            });
            await fetchOrders(); // Refresh the orders list
        } catch (err) {
            console.error('Error updating order status:', err);
            alert('Failed to update order status');
        }
    };

    const generateQuotation = async (orderId) => {
        try {
            const quotationData = {
                estimated_cost: prompt('Enter estimated cost:'),
                valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                notes: 'Quotation generated automatically'
            };
            
            if (quotationData.estimated_cost) {
                await api.post(`/orders/${orderId}/quotation`, quotationData);
                await fetchOrders();
                alert('Quotation generated successfully');
            }
        } catch (err) {
            console.error('Error generating quotation:', err);
            alert('Failed to generate quotation');
        }
    };

    const viewOrderTracking = async (orderId) => {
        try {
            const response = await api.get(`/orders/${orderId}/tracking`);
            setTrackingData(response.data);
            setIsTrackingDialogOpen(true);
        } catch (err) {
            console.error('Error fetching tracking data:', err);
            alert('Failed to load tracking information');
        }
    };

    const deleteOrder = async (orderId) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            try {
                await api.delete(`/orders/${orderId}`);
                await fetchOrders(); // Refresh the orders list
            } catch (err) {
                console.error('Error deleting order:', err);
                alert('Failed to delete order');
            }
        }
    };

    const cancelOrder = async (order) => {
        const confirmMessage = order.status === 'In_Production' || order.status === 'Ready_for_Delivery' ? 
            'This order is already in production. Cancellation may incur charges. Are you sure you want to cancel?' :
            'Are you sure you want to cancel this order?';
            
        if (window.confirm(confirmMessage)) {
            try {
                await api.post(`/orders/${order._id}/cancel`, {
                    cancelledBy: currentUser.id,
                    reason: 'Customer cancellation'
                });
                
                await fetchOrders(); // Refresh the orders list
                alert('Order cancelled successfully!');
            } catch (err) {
                console.error('Error cancelling order:', err);
                alert('Failed to cancel order. Please contact support.');
            }
        }
    };

    // Employee Assignment Functions
    const fetchAvailableEmployees = async () => {
        try {
            console.log('Fetching available employees...');
            const response = await api.get('/hr/employees/available');
            console.log('Available employees response:', response.data);
            setAvailableEmployees(response.data);
        } catch (err) {
            console.error('Error fetching employees:', err);
            console.error('Error details:', err.response?.data);
            alert('Failed to load available employees');
        }
    };

    const openAssignDialog = (order) => {
        setOrderToAssign(order);
        setSelectedEmployee("");
        setIsAssignDialogOpen(true);
        fetchAvailableEmployees();
    };

    const openPaymentDialog = (order) => {
        setOrderToPay(order);
        setPaymentReceipt(null);
        setIsPaymentDialogOpen(true);
    };

    const assignOrderToEmployee = async () => {
        if (!selectedEmployee || !orderToAssign) return;

        setAssignmentLoading(true);
        try {
            const employee = availableEmployees.find(emp => emp.employeeId === selectedEmployee);
            
            console.log('Order to assign:', orderToAssign);
            console.log('Employee:', employee);
            console.log('Order ID being used:', orderToAssign._id);
            
            // Assign order to employee
            await api.post(`/orders/${orderToAssign._id}/assign`, {
                employeeId: employee.employeeId,
                employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`
                // Note: assignedBy removed since we don't have a valid user ID
            });

            // Update employee workload
            await api.post(`/hr/employees/${employee.employeeId}/workload/update`, {
                action: 'assign',
                orderId: orderToAssign._id
            });

            await fetchOrders();
            setIsAssignDialogOpen(false);
            alert('Order assigned successfully!');
        } catch (err) {
            console.error('Error assigning order:', err);
            console.error('Error details:', err.response?.data);
            alert('Failed to assign order to employee');
        } finally {
            setAssignmentLoading(false);
        }
    };

    const unassignOrder = async (order) => {
        if (!order.assigned_employee) return;
        
        // Prevent unassigning orders that are in production or beyond
        if (order.status === 'In_Production' || order.status === 'Ready_for_Delivery' || 
            order.status === 'In_Transit' || order.status === 'Delivered' || order.status === 'Completed') {
            alert('Cannot unassign employee from orders that are in production or completed stages.');
            return;
        }

        try {
            // Unassign order
            await api.post(`/orders/${order._id}/unassign`, {
                assignedBy: 'current-user-id' // Replace with actual user ID
            });

            // Update employee workload
            await api.post(`/hr/employees/${order.assigned_employee.employeeId}/workload/update`, {
                action: 'unassign',
                orderId: order._id
            });

            await fetchOrders();
            alert('Order unassigned successfully!');
        } catch (err) {
            console.error('Error unassigning order:', err);
            alert('Failed to unassign order');
        }
    };

    const submitPaymentReceipt = async () => {
        if (!paymentReceipt || !orderToPay) {
            alert('Please select a receipt file to upload.');
            return;
        }

        // Validate payment details
        if (!paymentDetails.bank || !paymentDetails.depositedAmount || !paymentDetails.branch || !paymentDetails.paymentDate) {
            alert('Please fill in all payment details (Bank, Deposited Amount, Branch, Payment Date).');
            return;
        }

        // Validate deposited amount matches order total
        const orderTotal = orderToPay.total || orderToPay.final_amount;
        const depositedAmount = parseFloat(paymentDetails.depositedAmount);
        if (Math.abs(depositedAmount - orderTotal) > 0.01) {
            const proceed = confirm(`Warning: Deposited amount (${formatCurrency(depositedAmount)}) does not match order total (${formatCurrency(orderTotal)}). Do you want to proceed?`);
            if (!proceed) return;
        }

        setPaymentLoading(true);
        try {
            const formData = new FormData();
            formData.append('receipt', paymentReceipt);
            formData.append('orderId', orderToPay._id);
            formData.append('customerId', currentUser.customerId || currentUser.id);
            
            // Append payment details
            formData.append('paymentDetails', JSON.stringify(paymentDetails));

            await api.post(`/orders/${orderToPay._id}/payment-receipt`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            await fetchOrders();
            setIsPaymentDialogOpen(false);
            setPaymentReceipt(null);
            setOrderToPay(null);
            setPaymentDetails({
                bank: '',
                depositedAmount: '',
                branch: '',
                paymentDate: ''
            });
            alert('Payment receipt uploaded successfully! We will verify your payment and update the order status.');
        } catch (err) {
            console.error('Error uploading payment receipt:', err);
            alert('Failed to upload payment receipt. Please try again.');
        } finally {
            setPaymentLoading(false);
        }
    };

    // Enhanced filtering
    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || order.status === filterStatus;
        const matchesPriority = filterPriority === "all" || order.priority === filterPriority;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    // Update isCustomer and showCreateButton based on currentUser
    useEffect(() => {
        if (currentUser) {
            const customerRole = currentUser.role === 'Customer';
            setIsCustomer(customerRole);
            setShowCreateButton(!customerRole);
        }
    }, [currentUser]);

    if (loading) {
        return (
            <MainLayout 
                onCreateOrder={() => setIsDialogOpen(true)}
                showCreateOrderButton={showCreateButton}
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                        <p className="mt-4 text-gray-600">Loading orders...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout 
                onCreateOrder={() => setIsDialogOpen(true)}
                showCreateOrderButton={showCreateButton}
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={fetchOrders}>Try Again</Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout 
            onCreateOrder={() => setIsDialogOpen(true)}
            showCreateOrderButton={showCreateButton}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {isCustomer ? 'My Orders' : 'Orders'}
                        </h1>
                        <p className="text-muted-foreground">
                            {isCustomer 
                                ? 'View and track your printing orders' 
                                : 'Manage customer orders and track their progress'
                            }
                        </p>
                    </div>
                    {/* Customer Add Orders Button */}
                    {isCustomer && (
                        <Button onClick={() => setIsCustomerOrderDialogOpen(true)} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Orders
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Production">In Production</SelectItem>
                            <SelectItem value="Ready for Pickup">Ready for Pickup</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Orders Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Order Date</TableHead>
                                <TableHead>Delivery Date</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Assigned To</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.map((order) => (
                                <TableRow key={order._id}>
                                    <TableCell className="font-medium">{order.orderId}</TableCell>
                                    <TableCell>{order.customer_name}</TableCell>
                                    <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'TBD'}
                                    </TableCell>
                                    <TableCell>
                                        {order.items?.length || 0} item(s)
                                    </TableCell>
                                    <TableCell>{formatCurrency(order.total)}</TableCell>
                                    <TableCell>
                                        {order.assigned_employee ? (
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">
                                                    {order.assigned_employee.employeeName}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {order.assigned_employee.employeeId}
                                                </span>
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="text-gray-500">
                                                Unassigned
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={order.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                                    View details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => viewOrderTracking(order._id)}>
                                                    Track Order
                                                </DropdownMenuItem>
                                                
                                                {/* Customer-specific actions */}
                                                {currentUser && currentUser.role === 'Customer' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => openPaymentDialog(order)}>
                                                            💳 Buy - Upload Receipt
                                                        </DropdownMenuItem>
                                                        
                                                        {/* Allow customers to cancel orders (except delivered/completed) */}
                                                        {order.status !== 'Delivered' && order.status !== 'Completed' && (
                                                            <DropdownMenuItem 
                                                                onClick={() => cancelOrder(order)}
                                                                className="text-orange-600"
                                                            >
                                                                🚫 Cancel Order
                                                            </DropdownMenuItem>
                                                        )}
                                                    </>
                                                )}
                                                
                                                {/* Admin/Employee only actions */}
                                                {currentUser && currentUser.role !== 'Customer' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        
                                                        {/* Assignment Actions */}
                                                        {!order.assigned_employee ? (
                                                            <DropdownMenuItem onClick={() => openAssignDialog(order)}>
                                                                Assign to Employee
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            /* Only show unassign if not in production or beyond */
                                                            order.status !== 'In_Production' && 
                                                            order.status !== 'Ready_for_Delivery' && 
                                                            order.status !== 'In_Transit' && 
                                                            order.status !== 'Delivered' && 
                                                            order.status !== 'Completed' && (
                                                                <DropdownMenuItem onClick={() => unassignOrder(order)}>
                                                                    Unassign Employee
                                                                </DropdownMenuItem>
                                                            )
                                                        )}
                                                        
                                                        <DropdownMenuSeparator />
                                                        {/* Only allow deletion of orders not in production */}
                                                        {(order.status === 'Pending' || order.status === 'Confirmed') && (
                                                            <DropdownMenuItem 
                                                                onClick={() => deleteOrder(order._id)}
                                                                className="text-red-600"
                                                            >
                                                                Delete
                                                            </DropdownMenuItem>
                                                        )}
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredOrders.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                {searchTerm || filterStatus !== "all" 
                                    ? "No orders match your search criteria."
                                    : isCustomer
                                        ? "You haven't placed any orders yet."
                                        : "No orders found. Create your first order to get started."
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Order Details Dialog */}
                {selectedOrder && (
                    <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Order Details - {selectedOrder.orderId}</DialogTitle>
                                <DialogDescription>
                                    View complete order information
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Customer</label>
                                        <p className="text-sm text-muted-foreground">{selectedOrder.customer_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Status</label>
                                        <div className="mt-1">
                                            <StatusBadge status={selectedOrder.status} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Order Date</label>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(selectedOrder.orderDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Delivery Date</label>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedOrder.deliveryDate ? 
                                                new Date(selectedOrder.deliveryDate).toLocaleDateString() : 'TBD'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Items</label>
                                    <div className="mt-2 space-y-2">
                                        {selectedOrder.items?.map((item, index) => (
                                            <div key={index} className="flex justify-between bg-gray-50 p-2 rounded">
                                                <span>{item.product}</span>
                                                <span>Qty: {item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {selectedOrder.notes && (
                                    <div>
                                        <label className="text-sm font-medium">Notes</label>
                                        <p className="text-sm text-muted-foreground mt-1">{selectedOrder.notes}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium">Total</label>
                                    <p className="text-lg font-bold">{formatCurrency(selectedOrder.total)}</p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* New Order Dialog - Admin/Employee only */}
                {!isCustomer && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create New Order</DialogTitle>
                                <DialogDescription>
                                    Add a new customer order to the system
                                </DialogDescription>
                            </DialogHeader>
                            <NewOrderForm 
                                onClose={() => setIsDialogOpen(false)}
                                onOrderCreated={fetchOrders}
                            />
                        </DialogContent>
                    </Dialog>
                )}

                {/* Assignment Dialog - Admin/Employee only */}
                {!isCustomer && (
                    <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Assign Order to Employee</DialogTitle>
                                <DialogDescription>
                                    Select an employee to assign order {orderToAssign?.orderId} to.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <label className="text-sm font-medium">Select Employee</label>
                                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Choose an employee..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableEmployees.map((employee) => (
                                                <SelectItem key={employee.employeeId} value={employee.employeeId}>
                                                    <div className="flex flex-col items-start">
                                                        <span className="font-medium">
                                                            {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {employee.employment.position} • {employee.workload.activeOrders} active orders
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {selectedEmployee && (
                                    <div className="p-3 bg-gray-50 rounded-md">
                                        {(() => {
                                            const employee = availableEmployees.find(emp => emp.employeeId === selectedEmployee);
                                            return employee ? (
                                                <div className="text-sm">
                                                    <div><strong>Department:</strong> {employee.employment.department}</div>
                                                    <div className="flex items-center">
                                                        <strong>Status:</strong> 
                                                        <Badge variant="outline" className="ml-1">
                                                            {employee.workload.availability}
                                                        </Badge>
                                                    </div>
                                                    <div><strong>Skills:</strong> {employee.workload.skills?.join(', ') || 'None specified'}</div>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={assignOrderToEmployee} 
                                    disabled={!selectedEmployee || assignmentLoading}
                                >
                                    {assignmentLoading ? 'Assigning...' : 'Assign Order'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Customer Order Dialog */}
                {isCustomer && (
                    <Dialog open={isCustomerOrderDialogOpen} onOpenChange={setIsCustomerOrderDialogOpen}>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Place New Order</DialogTitle>
                                <DialogDescription>
                                    Fill out the details for your printing order. Price will be calculated automatically.
                                </DialogDescription>
                            </DialogHeader>
                            <CustomerOrderForm 
                                onClose={() => setIsCustomerOrderDialogOpen(false)}
                                onOrderCreated={fetchOrders}
                                currentUser={currentUser}
                            />
                        </DialogContent>
                    </Dialog>
                )}

                {/* Order Tracking Dialog */}
                <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Order Tracking</DialogTitle>
                            <DialogDescription>
                                Track the progress of your order
                            </DialogDescription>
                        </DialogHeader>
                        {trackingData ? (
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-blue-800 mb-2">Order Information</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-blue-700">Order ID:</span>
                                            <p className="font-medium text-blue-900">{trackingData.orderId}</p>
                                        </div>
                                        <div>
                                            <span className="text-blue-700">Status:</span>
                                            <div className="mt-1">
                                                <StatusBadge status={trackingData.status} />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-blue-700">Order Date:</span>
                                            <p className="font-medium text-blue-900">
                                                {new Date(trackingData.orderDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-blue-700">Expected Delivery:</span>
                                            <p className="font-medium text-blue-900">
                                                {trackingData.deliveryDate ? 
                                                    new Date(trackingData.deliveryDate).toLocaleDateString() : 'TBD'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Timeline */}
                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-800">Order Progress</h4>
                                    <div className="space-y-3">
                                        {[
                                            { status: 'Pending', label: 'Order Placed', icon: '📝' },
                                            { status: 'Confirmed', label: 'Order Confirmed', icon: '✅' },
                                            { status: 'In_Production', label: 'In Production', icon: '🏭' },
                                            { status: 'Ready_for_Delivery', label: 'Ready for Delivery', icon: '📦' },
                                            { status: 'In_Transit', label: 'In Transit', icon: '🚚' },
                                            { status: 'Delivered', label: 'Delivered', icon: '🎉' }
                                        ].map((step, index) => {
                                            const isCompleted = getStatusOrder(trackingData.status) >= getStatusOrder(step.status);
                                            const isCurrent = trackingData.status === step.status;
                                            
                                            return (
                                                <div key={step.status} className="flex items-center space-x-3">
                                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                                        isCompleted ? 'bg-green-500 text-white' : 
                                                        isCurrent ? 'bg-blue-500 text-white' : 
                                                        'bg-gray-200 text-gray-500'
                                                    }`}>
                                                        {isCompleted ? '✓' : step.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-medium ${
                                                            isCurrent ? 'text-blue-600' : 
                                                            isCompleted ? 'text-green-600' : 'text-gray-500'
                                                        }`}>
                                                            {step.label}
                                                        </p>
                                                    </div>
                                                    {isCurrent && (
                                                        <Badge variant="outline" className="text-xs">Current</Badge>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Additional Details */}
                                {trackingData.assigned_employee && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-800 mb-2">Assigned Staff</h4>
                                        <p className="text-sm text-gray-600">
                                            {trackingData.assigned_employee.name}
                                        </p>
                                    </div>
                                )}

                                {trackingData.notes && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-800 mb-2">Notes</h4>
                                        <p className="text-sm text-gray-600">{trackingData.notes}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Loading tracking information...</p>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsTrackingDialogOpen(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>)

                {/* Payment Receipt Upload Dialog */}
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Upload Payment Receipt</DialogTitle>
                            <DialogDescription>
                                Upload your payment receipt and provide payment details for order #{orderToPay?.orderId}
                            </DialogDescription>
                        </DialogHeader>
                        
                        {orderToPay && (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-sm text-blue-800 mb-2">Order Summary</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span className="text-blue-700">Order ID:</span>
                                        <span className="text-blue-900 font-medium">{orderToPay.orderId}</span>
                                        <span className="text-blue-700">Total Amount:</span>
                                        <span className="text-blue-900 font-bold text-lg">{formatCurrency(orderToPay.total || orderToPay.final_amount)}</span>
                                        <span className="text-blue-700">Status:</span>
                                        <span className="text-blue-900">{orderToPay.status}</span>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <h4 className="font-medium text-sm text-yellow-800 mb-3">Payment Details</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-yellow-700 block mb-1">Bank Name *</label>
                                            <Select
                                                value={paymentDetails.bank}
                                                onValueChange={(val) => setPaymentDetails({ ...paymentDetails, bank: val })}
                                            >
                                                <SelectTrigger className="w-full text-sm ">
                                                    <SelectValue placeholder="Select bank" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="BOC">Bank of Ceylon</SelectItem>
                                                    <SelectItem value="PB">People's Bank</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs font-medium text-yellow-700 block mb-1">Deposited Amount *</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={paymentDetails.depositedAmount}
                                                    onChange={(e) => setPaymentDetails({...paymentDetails, depositedAmount: e.target.value})}
                                                    className="text-sm"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-yellow-700 block mb-1">Payment Date *</label>
                                                <Input
                                                    type="date"
                                                    value={paymentDetails.paymentDate}
                                                    onChange={(e) => setPaymentDetails({...paymentDetails, paymentDate: e.target.value})}
                                                    className="text-sm"
                                                    min={new Date(Date.now()).toISOString().split('T')[0]}
                                                    max={new Date(Date.now() + 1209600000).toISOString().split('T')[0]}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="text-xs font-medium text-yellow-700 block mb-1">Branch *</label>
                                            <Input
                                                placeholder="e.g., Colombo Main Branch"
                                                value={paymentDetails.branch}
                                                onChange={(e) => setPaymentDetails({...paymentDetails, branch: e.target.value})}
                                                className="text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-lg border">
                                    <label className="text-sm font-medium text-gray-700 block mb-2">Payment Receipt File *</label>
                                    <Input
                                        type="file"
                                        onChange={(e) => setPaymentReceipt(e.target.files[0])}
                                        className="text-sm"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Upload clear image of your payment receipt (JPG, PNG, PDF) - Max 5MB
                                    </p>
                                </div>

                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <p className="text-xs text-green-700">
                                        <strong>Important:</strong> Please ensure the payment details above match exactly with your receipt. 
                                        This information will be used to verify your payment.
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        <DialogFooter className="mt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => {
                                    setIsPaymentDialogOpen(false);
                                    setPaymentDetails({
                                        bank: '',
                                        depositedAmount: '',
                                        branch: '',
                                        paymentDate: ''
                                    });
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={submitPaymentReceipt} 
                                disabled={paymentLoading || !paymentReceipt || !paymentDetails.bank || !paymentDetails.depositedAmount || !paymentDetails.branch || !paymentDetails.paymentDate}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {paymentLoading ? 'Uploading...' : 'Submit Payment'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}

// New Order Form Component
function NewOrderForm({ onClose, onOrderCreated }) {
    const [formData, setFormData] = useState({
        customer: '',
        deliveryDate: '',
        notes: '',
        items: [{ product: '', quantity: 1 }]
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.customer || formData.items.some(item => !item.product)) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            // Calculate total based on items (you might want to add pricing logic)
            const total = formData.items.reduce((sum, item) => sum + (item.quantity * 10), 0); // Placeholder pricing
            
            const orderData = {
                ...formData,
                total,
                status: 'Pending'
            };

            await api.post('/orders', orderData);
            onOrderCreated();
            onClose();
            alert('Order created successfully!');
        } catch (err) {
            console.error('Error creating order:', err);
            alert('Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { product: '', quantity: 1 }]
        }));
    };

    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const updateItem = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => 
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Customer Name *</label>
                    <Input
                        value={formData.customer}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer: e.target.value }))}
                        placeholder="Enter customer name"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Delivery Date</label>
                    <Input
                        type="date"
                        value={formData.deliveryDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium">Items *</label>
                <div className="space-y-2 mt-2">
                    {formData.items.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <Input
                                placeholder="Product name"
                                value={item.product}
                                onChange={(e) => updateItem(index, 'product', e.target.value)}
                                className="flex-1"
                                required
                            />
                            <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-24"
                                placeholder="Qty"
                            />
                            {formData.items.length > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeItem(index)}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="mt-2"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                </Button>
            </div>

            <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Order notes (optional)"
                />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Order'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// Customer Order Form Component
function CustomerOrderForm({ onClose, onOrderCreated, currentUser }) {
    const [formData, setFormData] = useState({
        productType: '',
        material: '',
        coloring: '',
        size: '',
        printType: '',
        quantity: 1,
        designSample: null,
        specialInstructions: '',
        urgency: 'standard',
        // Updated delivery address fields for Sri Lankan address format with District
        deliveryAddress: {
            street1: '',
            street2: '',
            city: '',
            district: '',
            state: '',
            zip: '',
            country: 'Sri Lanka'
        }
    });
    const [loading, setLoading] = useState(false);
    const [estimatedPrice, setEstimatedPrice] = useState(0);
    const [deliveryCharge, setDeliveryCharge] = useState(0);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [materialsLoading, setMaterialsLoading] = useState(false);

    // Sri Lankan cities and their approximate distance from Panadura (in KM)
    const cityDistances = {
        'Panadura': 0,
        'Colombo': 25,
        'Gampaha': 35,
        'Kalutara': 20,
        'Moratuwa': 15,
        'Dehiwala': 20,
        'Mount Lavinia': 18,
        'Negombo': 45,
        'Kandy': 120,
        'Galle': 90,
        'Matara': 140,
        'Ratnapura': 95,
        'Kurunegala': 85,
        'Anuradhapura': 180,
        'Trincomalee': 250,
        'Batticaloa': 280,
        'Jaffna': 400,
        'Badulla': 200,
        'Nuwara Eliya': 160,
        'Polonnaruwa': 220
    };

    // Sri Lankan Provinces, Districts, and Cities with delivery distances
    const sriLankanLocationData = {
        'Western': {
            districts: {
                'Colombo': {
                    cities: ['Colombo', 'Dehiwala', 'Mount Lavinia', 'Moratuwa', 'Kelaniya', 'Maharagama', 'Kotte', 'Kolonnawa']
                },
                'Gampaha': {
                    cities: ['Gampaha', 'Negombo', 'Ja-Ela', 'Wattala', 'Minuwangoda', 'Divulapitiya', 'Mirigama', 'Veyangoda']
                },
                'Kalutara': {
                    cities: ['Kalutara', 'Panadura', 'Horana', 'Beruwala', 'Bentota', 'Aluthgama', 'Matugama', 'Bandaragama']
                }
            }
        },
        'Central': {
            districts: {
                'Kandy': {
                    cities: ['Kandy', 'Gampola', 'Nawalapitiya', 'Peradeniya', 'Kadugannawa', 'Pilimatalawa', 'Harispattuwa', 'Udunuwara']
                },
                'Matale': {
                    cities: ['Matale', 'Dambulla', 'Sigiriya', 'Galewela', 'Ukuwela', 'Pallepola', 'Rattota', 'Yatawatta']
                },
                'Nuwara Eliya': {
                    cities: ['Nuwara Eliya', 'Hatton', 'Talawakele', 'Ginigathena', 'Kotagala', 'Maskeliya', 'Bogawantalawa', 'Walapane']
                }
            }
        },
        'Southern': {
            districts: {
                'Galle': {
                    cities: ['Galle', 'Hikkaduwa', 'Ambalangoda', 'Bentota', 'Elpitiya', 'Karapitiya', 'Baddegama', 'Yakkalamulla']
                },
                'Matara': {
                    cities: ['Matara', 'Weligama', 'Mirissa', 'Dikwella', 'Hakmana', 'Akuressa', 'Kamburupitiya', 'Devinuwara']
                },
                'Hambantota': {
                    cities: ['Hambantota', 'Tangalle', 'Tissamaharama', 'Ambalantota', 'Beliatta', 'Weeraketiya', 'Kataragama', 'Okewela']
                }
            }
        },
        'Eastern': {
            districts: {
                'Batticaloa': {
                    cities: ['Batticaloa', 'Kalmunai', 'Eravur', 'Valaichchenai', 'Chenkaladi', 'Oddamavadi', 'Koralai Pattu', 'Manmunai North']
                },
                'Ampara': {
                    cities: ['Ampara', 'Akkaraipattu', 'Kalmunai', 'Sammanthurai', 'Nintavur', 'Addalachchenai', 'Alayadivembu', 'Dehiattakandiya']
                },
                'Trincomalee': {
                    cities: ['Trincomalee', 'Kinniya', 'Mutur', 'Kuchchaveli', 'Kantale', 'Seruvila', 'Thambalagamuwa', 'Gomarankadawala']
                }
            }
        },
        'Northern': {
            districts: {
                'Jaffna': {
                    cities: ['Jaffna', 'Point Pedro', 'Chavakachcheri', 'Nallur', 'Kondavil', 'Kopay', 'Manipay', 'Sandilipay']
                },
                'Kilinochchi': {
                    cities: ['Kilinochchi', 'Pallai', 'Paranthan', 'Poonakary', 'Akkarayankulam', 'Elephant Pass', 'Vishvamadu', 'Uruthirapuram']
                },
                'Mannar': {
                    cities: ['Mannar', 'Nanattan', 'Madhu', 'Pesalai', 'Thalvupadu', 'Erukkalampiddy', 'Vidattaltivu', 'Nanaddan']
                },
                'Mullaitivu': {
                    cities: ['Mullaitivu', 'Puthukkudiyiruppu', 'Oddusuddan', 'Thunukkai', 'Welipennai', 'Manthai East', 'Kokkilai', 'Chemmalai']
                },
                'Vavuniya': {
                    cities: ['Vavuniya', 'Nedunkeni', 'Settikulam', 'Omanthai', 'Vengalacheddikulam', 'Puliyankulam', 'Kebitigollewa', 'Thambalagamuwa']
                }
            }
        },
        'North Western': {
            districts: {
                'Kurunegala': {
                    cities: ['Kurunegala', 'Kuliyapitiya', 'Narammala', 'Wariyapola', 'Pannala', 'Melsiripura', 'Bingiriya', 'Bamunakotuwa']
                },
                'Puttalam': {
                    cities: ['Puttalam', 'Chilaw', 'Wennappuwa', 'Anamaduwa', 'Nattandiya', 'Dankotuwa', 'Marawila', 'Mundel']
                }
            }
        },
        'North Central': {
            districts: {
                'Anuradhapura': {
                    cities: ['Anuradhapura', 'Kekirawa', 'Habarana', 'Mihintale', 'Medawachchiya', 'Galkiriyagama', 'Tambuttegama', 'Eppawala']
                },
                'Polonnaruwa': {
                    cities: ['Polonnaruwa', 'Kaduruwela', 'Medirigiriya', 'Hingurakgoda', 'Dimbulagala', 'Lankapura', 'Welikanda', 'Thamankaduwa']
                }
            }
        },
        'Uva': {
            districts: {
                'Badulla': {
                    cities: ['Badulla', 'Bandarawela', 'Ella', 'Haputale', 'Welimada', 'Mahiyanganaya', 'Passara', 'Haldummulla']
                },
                'Monaragala': {
                    cities: ['Monaragala', 'Wellawaya', 'Buttala', 'Kataragama', 'Bibila', 'Medagama', 'Siyambalanduwa', 'Madulla']
                }
            }
        },
        'Sabaragamuwa': {
            districts: {
                'Ratnapura': {
                    cities: ['Ratnapura', 'Balangoda', 'Pelmadulla', 'Embilipitiya', 'Kuruwita', 'Eheliyagoda', 'Kahawatta', 'Godakawela']
                },
                'Kegalle': {
                    cities: ['Kegalle', 'Mawanella', 'Rambukkana', 'Galigamuwa', 'Warakapola', 'Ruwanwella', 'Deraniyagala', 'Yatiyantota']
                }
            }
        }
    };

    // Helper functions for location data
    const getDistrictsForProvince = (provinceName) => {
        if (!provinceName || !sriLankanLocationData[provinceName]) return [];
        return Object.keys(sriLankanLocationData[provinceName].districts);
    };

    const getCitiesForDistrict = (provinceName, districtName) => {
        if (!provinceName || !districtName || 
            !sriLankanLocationData[provinceName] || 
            !sriLankanLocationData[provinceName].districts[districtName]) return [];
        
        return sriLankanLocationData[provinceName].districts[districtName].cities.map(city => ({
            name: city,
            distance: cityDistances[city] || 100 // Default 100km if not found
        }));
    };

    // Calculate delivery charge based on distance from Panadura
    const calculateDeliveryCharge = (city) => {
        const distance = cityDistances[city] || 50; // Default 50km if city not found
        if (distance === 0) return 0; // Free delivery for Panadura
        return Math.ceil(distance / 10) * 100; // Rs 100 per 10km (rounded up)
    };

    // Update delivery charge when city changes
    useEffect(() => {
        const charge = calculateDeliveryCharge(formData.deliveryAddress.city);
        setDeliveryCharge(charge);
    }, [formData.deliveryAddress.city]);

    // Fetch raw materials data
    const fetchRawMaterials = async () => {
        try {
            setMaterialsLoading(true);
            const response = await api.get('/raw-materials');
            setRawMaterials(response.data);
        } catch (error) {
            console.error('Error fetching raw materials:', error);
        } finally {
            setMaterialsLoading(false);
        }
    };

    // Fetch raw materials on component mount
    useEffect(() => {
        fetchRawMaterials();
    }, []);

    // Product options
    const productTypes = [
        'Business Cards', 'Brochures', 'Flyers', 'Posters', 'Banners', 
        'Stickers', 'Booklets', 'Invitations', 'Postcards', 'Other'
    ];
    
    const allMaterials = [
        'Standard Paper (80gsm)', 'Premium Paper (120gsm)', 'Cardstock (250gsm)', 
        'Glossy Paper', 'Matte Paper', 'Recycled Paper', 'Vinyl', 'Fabric', 'Canvas'
    ];

    // Material mapping from order materials to raw materials
    const materialToRawMaterialMapping = {
        'Standard Paper (80gsm)': 'A4 Premium White Paper',
        'Premium Paper (120gsm)': 'A4 Premium White Paper',
        'Cardstock (250gsm)': 'Cardstock 300gsm White',
        'Glossy Paper': 'A3 Photo Paper Glossy',
        'Matte Paper': 'A4 Premium White Paper',
        'Recycled Paper': 'A4 Premium White Paper',
        'Vinyl': 'Vinyl Banner Material',
        'Fabric': 'Vinyl Banner Material',
        'Canvas': 'Vinyl Banner Material'
    };

    // Get raw material data for a given order material
    const getRawMaterialData = (orderMaterial) => {
        const rawMaterialName = materialToRawMaterialMapping[orderMaterial];
        return rawMaterials.find(rm => rm.material_name === rawMaterialName);
    };

    // Material mapping by product type
    const materialMapping = {
        'Business Cards': ['Cardstock (250gsm)', 'Premium Paper (120gsm)', 'Glossy Paper', 'Matte Paper'],
        'Brochures': ['Standard Paper (80gsm)', 'Premium Paper (120gsm)', 'Glossy Paper', 'Matte Paper'],
        'Flyers': ['Standard Paper (80gsm)', 'Premium Paper (120gsm)', 'Glossy Paper', 'Recycled Paper'],
        'Posters': ['Premium Paper (120gsm)', 'Glossy Paper', 'Matte Paper', 'Canvas'],
        'Banners': ['Vinyl', 'Fabric', 'Canvas'],
        'Stickers': ['Vinyl', 'Glossy Paper'],
        'Booklets': ['Standard Paper (80gsm)', 'Premium Paper (120gsm)', 'Matte Paper', 'Recycled Paper'],
        'Invitations': ['Cardstock (250gsm)', 'Premium Paper (120gsm)', 'Glossy Paper'],
        'Postcards': ['Cardstock (250gsm)', 'Glossy Paper', 'Matte Paper'],
        'Other': allMaterials
    };

    // Get filtered materials based on selected product type
    const materials = formData.productType ? materialMapping[formData.productType] || [] : [];
    
    // Reset material selection when product type changes
    useEffect(() => {
        if (formData.productType && !materials.includes(formData.material)) {
            setFormData(prev => ({ ...prev, material: '' }));
        }
    }, [formData.productType]);
    
    const colorOptions = [
        'Black & White', 'Single Color', 'Two Color', 'Full Color (CMYK)', 'Spot Colors'
    ];
    
    const sizeOptions = [
        'A4 (210x297mm)', 'A5 (148x210mm)', 'A6 (105x148mm)', 
        'Letter (8.5x11")', 'Business Card (85x55mm)', 'Custom Size'
    ];
    
    const printTypes = [
        'Digital Print', 'Offset Print', 'Large Format', 'Screen Print', 'Letterpress'
    ];

    // Price calculation effect
    useEffect(() => {
        calculatePrice();
    }, [formData.productType, formData.material, formData.coloring, formData.size, formData.printType, formData.quantity, formData.urgency, deliveryCharge]);

    const calculatePrice = () => {
        let basePrice = 0;
        let materialCost = 0;
        
        if (!formData.productType || !formData.material || !formData.coloring || !formData.size || !formData.printType) {
            setEstimatedPrice(0);
            return;
        }

        // Material cost calculation
        if (formData.material) {
            const rawMaterial = getRawMaterialData(formData.material);
            if (rawMaterial) {
                // Calculate material usage per item
                let usagePerItem = 1; // Base usage
                
                // Adjust usage based on product size
                if (formData.size) {
                    if (formData.size.includes('A3')) usagePerItem *= 2;
                    if (formData.size.includes('Business Card')) usagePerItem *= 0.1;
                }
                
                // Adjust for product type
                if (formData.productType === 'Banners' || formData.productType === 'Posters') {
                    usagePerItem *= 0.5; // Different measurement unit
                }
                
                // Add waste factor
                usagePerItem *= 1.1;
                
                materialCost = rawMaterial.unit_cost * usagePerItem * formData.quantity;
            }
        }
        
        // Base processing cost (labor, machine time, etc.)
        const productPrices = {
            'Business Cards': 0.3,
            'Brochures': 0.8,
            'Flyers': 0.5,
            'Posters': 2.0,
            'Banners': 5.0,
            'Stickers': 0.4,
            'Booklets': 1.0,
            'Invitations': 0.3,
            'Postcards': 0.25,
            'Other': 0.5
        };
        
        basePrice = productPrices[formData.productType] || 0;
        
        // Material multiplier (processing difficulty multiplier)
        const materialMultipliers = {
            'Standard Paper (80gsm)': 1.0,
            'Premium Paper (120gsm)': 1.1,
            'Cardstock (250gsm)': 1.2,
            'Glossy Paper': 1.15,
            'Matte Paper': 1.05,
            'Recycled Paper': 1.0,
            'Vinyl': 1.5,
            'Fabric': 1.8,
            'Canvas': 2.0
        };
        
        basePrice *= materialMultipliers[formData.material] || 1.0;
        
        // Color multiplier
        const colorMultipliers = {
            'Black & White': 1.0,
            'Single Color': 1.2,
            'Two Color': 1.4,
            'Full Color (CMYK)': 1.8,
            'Spot Colors': 2.0
        };
        
        basePrice *= colorMultipliers[formData.coloring] || 1.0;
        
        // Print type multiplier
        const printTypeMultipliers = {
            'Digital Print': 1.0,
            'Offset Print': 1.3,
            'Large Format': 2.0,
            'Screen Print': 1.5,
            'Letterpress': 2.5
        };
        
        basePrice *= printTypeMultipliers[formData.printType] || 1.0;
        
        // Quantity (bulk discount)
        let quantityPrice = basePrice * formData.quantity;
        if (formData.quantity >= 1000) {
            quantityPrice *= 0.8; // 20% discount for 1000+
        } else if (formData.quantity >= 500) {
            quantityPrice *= 0.9; // 10% discount for 500+
        }
        
        // Urgency multiplier
        const urgencyMultipliers = {
            'standard': 1.0,
            'express': 1.5,
            'rush': 2.0
        };
        
        quantityPrice *= urgencyMultipliers[formData.urgency] || 1.0;
        
        // Calculate final price
        const totalProductCost = quantityPrice + materialCost;
        const finalPrice = totalProductCost + deliveryCharge;
        
        setEstimatedPrice(Math.max(finalPrice, 5)); // Minimum Rs 5
        
        // Store breakdown for display (using a ref would be better, but this works)
        window.priceBreakdown = {
            processingCost: quantityPrice,
            materialCost: materialCost,
            deliveryCharge: deliveryCharge,
            total: Math.max(finalPrice, 5)
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.productType || !formData.material || !formData.coloring || !formData.size || !formData.printType) {
            alert('Please fill in all required fields');
            return;
        }

        if (!formData.deliveryAddress.street1 || !formData.deliveryAddress.city || !formData.deliveryAddress.district || !formData.deliveryAddress.state) {
            alert('Please fill in the required delivery address fields (Street 1, Province, District, and City)');
            return;
        }

        // Check material stock availability
        const rawMaterial = getRawMaterialData(formData.material);
        if (rawMaterial && rawMaterial.current_stock === 0) {
            alert('Selected material is out of stock. Please choose a different material.');
            return;
        }

        // Check if sufficient stock for order quantity
        if (rawMaterial) {
            let usagePerItem = 1;
            if (formData.size && formData.size.includes('A3')) usagePerItem *= 2;
            if (formData.size && formData.size.includes('Business Card')) usagePerItem *= 0.1;
            if (formData.productType === 'Banners' || formData.productType === 'Posters') usagePerItem *= 0.5;
            usagePerItem *= 1.1; // Waste factor
            
            const totalUsage = Math.ceil(usagePerItem * formData.quantity);
            if (rawMaterial.current_stock < totalUsage) {
                alert(`Insufficient material stock. Available: ${rawMaterial.current_stock} ${rawMaterial.unit_of_measurement}, Required: ${totalUsage} ${rawMaterial.unit_of_measurement}`);
                return;
            }
        }

        setLoading(true);
        try {
            // Calculate unit price
            const unitPrice = estimatedPrice / formData.quantity;
            
            const orderData = {
                customer_name: currentUser.name || currentUser.email,
                customer_email: currentUser.email,
                customer_phone: currentUser.phone || '',
                customer_address: `${formData.deliveryAddress.street1}${formData.deliveryAddress.street2 ? ', ' + formData.deliveryAddress.street2 : ''}, ${formData.deliveryAddress.city}, ${formData.deliveryAddress.district}, ${formData.deliveryAddress.state}${formData.deliveryAddress.zip ? ', ' + formData.deliveryAddress.zip : ''}, ${formData.deliveryAddress.country}`,
                customer_id: currentUser.customerId || currentUser.id,
                order_type: 'standard',
                delivery_address: formData.deliveryAddress,
                delivery_charge: deliveryCharge,
                items: [{
                    product: formData.productType,
                    quantity: formData.quantity,
                    unit_price: unitPrice,
                    specifications: JSON.stringify({
                        material: formData.material,
                        coloring: formData.coloring,
                        size: formData.size,
                        printType: formData.printType,
                        urgency: formData.urgency,
                        deliveryCity: formData.deliveryAddress.city
                    })
                }],
                total: estimatedPrice,
                final_amount: estimatedPrice,
                product_total: estimatedPrice - deliveryCharge, // Product price without delivery
                status: 'New',
                priority: formData.urgency === 'rush' ? 'urgent' : formData.urgency === 'express' ? 'high' : 'normal',
                notes: formData.specialInstructions || '',
                special_instructions: formData.specialInstructions || '',
                delivery_date: new Date(Date.now() + (formData.urgency === 'rush' ? 2 : formData.urgency === 'express' ? 5 : 7) * 24 * 60 * 60 * 1000),
                expected_completion_date: new Date(Date.now() + (formData.urgency === 'rush' ? 1 : formData.urgency === 'express' ? 3 : 5) * 24 * 60 * 60 * 1000)
            };

            await api.post('/orders', orderData);
            onClose();
            onOrderCreated();
            alert('Order placed successfully! You will receive a confirmation email shortly.');
        } catch (err) {
            console.error('Error creating order:', err);
            alert('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, designSample: file }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information Display */}
            <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Order Details</h3>
                <p className="text-sm text-gray-600">
                    <span className="font-medium">Customer:</span> {currentUser.name || currentUser.email}
                </p>
                {currentUser.email && (
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {currentUser.email}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Type */}
                <div>
                    <label className="text-sm font-medium text-gray-700">Product Type *</label>
                    <Select value={formData.productType} onValueChange={(value) => setFormData(prev => ({ ...prev, productType: value }))}>
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select product type" />
                        </SelectTrigger>
                        <SelectContent>
                            {productTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Product Type Info */}
                {formData.productType && (
                    <div className="md:col-span-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">
                                Compatible Materials for {formData.productType}
                            </h4>
                            <p className="text-sm text-blue-700 mb-2">
                                The following materials work best together for {formData.productType.toLowerCase()}:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {materials.map((material) => {
                                    const rawMaterial = getRawMaterialData(material);
                                    const isOutOfStock = rawMaterial && rawMaterial.current_stock === 0;
                                    return (
                                        <span
                                            key={material}
                                            className={`text-xs px-3 py-1 rounded-full ${
                                                isOutOfStock
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}
                                        >
                                            {material} {isOutOfStock && '(Out of Stock)'}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Material */}
                <div>
                    <label className="text-sm font-medium text-gray-700">Material *</label>
                    {materialsLoading ? (
                        <div className="mt-1 p-3 border rounded-lg">
                            <p className="text-sm text-gray-500">Loading materials...</p>
                        </div>
                    ) : (
                        <div className="mt-1 space-y-2">
                            {materials.length === 0 ? (
                                <p className="text-sm text-gray-500 p-2">Please select a product type first</p>
                            ) : (
                                materials.map((material) => {
                                    const rawMaterial = getRawMaterialData(material);
                                    const isOutOfStock = rawMaterial && rawMaterial.current_stock === 0;
                                    const isLowStock = rawMaterial && rawMaterial.current_stock <= rawMaterial.minimum_stock_level && rawMaterial.current_stock > 0;
                                    
                                    return (
                                        <div
                                            key={material}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                formData.material === material
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : isOutOfStock
                                                    ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => !isOutOfStock && setFormData(prev => ({ ...prev, material }))}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="material"
                                                            value={material}
                                                            checked={formData.material === material}
                                                            onChange={() => !isOutOfStock && setFormData(prev => ({ ...prev, material }))}
                                                            disabled={isOutOfStock}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className={`font-medium ${isOutOfStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                            {material}
                                                        </span>
                                                        {isOutOfStock && (
                                                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                                                Out of Stock
                                                            </span>
                                                        )}
                                                        {isLowStock && !isOutOfStock && (
                                                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                                                Low Stock
                                                            </span>
                                                        )}
                                                    </div>
                                                    {rawMaterial && (
                                                        <div className="mt-1 text-sm text-gray-600">
                                                            <p>Raw Material: {rawMaterial.material_name}</p>
                                                            <p>Available: {rawMaterial.current_stock} {rawMaterial.unit_of_measurement}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    {rawMaterial && (
                                                        <p className="text-sm font-medium text-green-600">
                                                            Rs {rawMaterial.unit_cost.toFixed(2)} per {rawMaterial.unit_of_measurement}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Coloring */}
                <div>
                    <label className="text-sm font-medium text-gray-700">Coloring *</label>
                    <Select value={formData.coloring} onValueChange={(value) => setFormData(prev => ({ ...prev, coloring: value }))}>
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select coloring option" />
                        </SelectTrigger>
                        <SelectContent>
                            {colorOptions.map((color) => (
                                <SelectItem key={color} value={color}>{color}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Size */}
                <div>
                    <label className="text-sm font-medium text-gray-700">Size *</label>
                    <Select value={formData.size} onValueChange={(value) => setFormData(prev => ({ ...prev, size: value }))}>
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                            {sizeOptions.map((size) => (
                                <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Print Type */}
                <div>
                    <label className="text-sm font-medium text-gray-700">Print Type *</label>
                    <Select value={formData.printType} onValueChange={(value) => setFormData(prev => ({ ...prev, printType: value }))}>
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select print type" />
                        </SelectTrigger>
                        <SelectContent>
                            {printTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Quantity */}
                <div>
                    <label className="text-sm font-medium text-gray-700">Quantity *</label>
                    <Input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        className="mt-1"
                        placeholder="Enter quantity"
                    />
                </div>
            </div>

            {/* Urgency */}
            <div>
                <label className="text-sm font-medium text-gray-700">Urgency</label>
                <Select value={formData.urgency} onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}>
                    <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="standard">Standard (7 days) - No extra charge</SelectItem>
                        <SelectItem value="express">Express (5 days) - +50% charge</SelectItem>
                        <SelectItem value="rush">Rush (2 days) - +100% charge</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Delivery Address */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Delivery Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Street Address 1 *</label>
                        <Input
                            value={formData.deliveryAddress.street1}
                            onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                deliveryAddress: { ...prev.deliveryAddress, street1: e.target.value }
                            }))}
                            className="mt-1"
                            placeholder="Enter street address line 1"
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Street Address 2</label>
                        <Input
                            value={formData.deliveryAddress.street2}
                            onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                deliveryAddress: { ...prev.deliveryAddress, street2: e.target.value }
                            }))}
                            className="mt-1"
                            placeholder="Enter street address line 2 (optional)"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Province/State *</label>
                        <Select 
                            value={formData.deliveryAddress.state} 
                            onValueChange={(value) => setFormData(prev => ({ 
                                ...prev, 
                                deliveryAddress: { 
                                    ...prev.deliveryAddress, 
                                    state: value,
                                    district: '', // Reset district when state changes
                                    city: '' // Reset city when state changes
                                }
                            }))}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select province/state" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(sriLankanLocationData).map((province) => (
                                    <SelectItem key={province} value={province}>
                                        {province} Province
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">District *</label>
                        <Select 
                            value={formData.deliveryAddress.district} 
                            onValueChange={(value) => setFormData(prev => ({ 
                                ...prev, 
                                deliveryAddress: { 
                                    ...prev.deliveryAddress, 
                                    district: value,
                                    city: '' // Reset city when district changes
                                }
                            }))}
                            disabled={!formData.deliveryAddress.state}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder={
                                    formData.deliveryAddress.state ? "Select district" : "Select province first"
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {getDistrictsForProvince(formData.deliveryAddress.state).map((district) => (
                                    <SelectItem key={district} value={district}>
                                        {district} District
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">City *</label>
                        <Select 
                            value={formData.deliveryAddress.city} 
                            onValueChange={(value) => setFormData(prev => ({ 
                                ...prev, 
                                deliveryAddress: { ...prev.deliveryAddress, city: value }
                            }))}
                            disabled={!formData.deliveryAddress.district}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder={
                                    formData.deliveryAddress.district ? "Select city" : "Select district first"
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {getCitiesForDistrict(formData.deliveryAddress.state, formData.deliveryAddress.district).map((cityData) => (
                                    <SelectItem key={cityData.name} value={cityData.name}>
                                        {cityData.name} {cityData.name === 'Panadura' ? '(Free Delivery)' : `(~${cityData.distance}km)`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">ZIP/Postal Code</label>
                        <Input
                            value={formData.deliveryAddress.zip}
                            onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                deliveryAddress: { ...prev.deliveryAddress, zip: e.target.value }
                            }))}
                            className="mt-1"
                            placeholder="Enter ZIP/postal code"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Country</label>
                        <Input
                            value={formData.deliveryAddress.country}
                            className="mt-1 bg-gray-100"
                            disabled
                        />
                    </div>
                </div>
                {formData.deliveryAddress.city && (
                    <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-blue-700">
                            <span className="font-medium">Delivery Charge:</span> {formatCurrency(deliveryCharge)}
                            {formData.deliveryAddress.city === 'Panadura' && " (Free delivery within Panadura!)"}
                        </p>
                    </div>
                )}
            </div>

            {/* Design Sample Upload */}
            <div>
                <label className="text-sm font-medium text-gray-700">Design Sample</label>
                <Input
                    type="file"
                    onChange={handleFileChange}
                    className="mt-1"
                    accept=".jpg,.jpeg,.png,.pdf,.ai,.eps"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Upload your design file (JPG, PNG, PDF, AI, EPS) - Optional
                </p>
            </div>

            {/* Special Instructions */}
            <div>
                <label className="text-sm font-medium text-gray-700">Special Instructions</label>
                <Textarea
                    className="mt-1"
                    rows="3"
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    placeholder="Any special requirements or notes for your order..."
                />
            </div>

            {/* Price Display */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="space-y-2">
                    {window.priceBreakdown && (
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-blue-800">Processing Cost:</span>
                                <span className="text-sm font-medium text-blue-900">{formatCurrency(window.priceBreakdown.processingCost)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-blue-800">Material Cost:</span>
                                <span className="text-sm font-medium text-blue-900">{formatCurrency(window.priceBreakdown.materialCost)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-blue-800">Delivery Charge:</span>
                                <span className="text-sm font-medium text-blue-900">{formatCurrency(window.priceBreakdown.deliveryCharge)}</span>
                            </div>
                        </>
                    )}
                    {!window.priceBreakdown && (
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-blue-800">Product Price:</span>
                                <span className="text-sm font-medium text-blue-900">{formatCurrency(estimatedPrice - deliveryCharge)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-blue-800">Delivery Charge:</span>
                                <span className="text-sm font-medium text-blue-900">{formatCurrency(deliveryCharge)}</span>
                            </div>
                        </>
                    )}
                    <hr className="border-blue-200" />
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-blue-900">Total Price:</span>
                        <span className="text-2xl font-bold text-blue-900">{formatCurrency(estimatedPrice)}</span>
                    </div>
                </div>
                <p className="text-sm text-blue-700 mt-2">
                    * Final price may vary based on design complexity and final specifications
                </p>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Placing Order...' : `Place Order - ${formatCurrency(estimatedPrice)}`}
                </Button>
            </DialogFooter>
        </form>
    );
}