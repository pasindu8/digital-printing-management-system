'use client';
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
    ClipboardList, 
    Clock, 
    CheckCircle, 
    AlertTriangle,
    Calendar,
    User,
    Briefcase
} from "lucide-react";
import api from '../services/api';
import { formatCurrency } from "@/lib/currency";
import { getCurrentUser } from "@/middleware/auth";

// Status badge component
const StatusBadge = ({ status }) => {
    let color;
    switch (status) {
        case "New":
        case "Pending":
            color = "bg-yellow-50 text-yellow-600 border-yellow-200";
            break;
        case "Confirmed":
            color = "bg-emerald-50 text-emerald-600 border-emerald-200";
            break;
        case "In_Production":
        case "In Production":
            color = "bg-blue-50 text-blue-600 border-blue-200";
            break;
        case "Quality_Check":
            color = "bg-purple-50 text-purple-600 border-purple-200";
            break;
        case "Ready_for_Pickup":
        case "Ready_for_Delivery":
            color = "bg-green-50 text-green-600 border-green-200";
            break;
        case "Completed":
        case "Delivered":
            color = "bg-gray-50 text-gray-600 border-gray-200";
            break;
        case "Cancelled":
            color = "bg-red-50 text-red-600 border-red-200";
            break;
        default:
            color = "bg-gray-50 text-gray-600 border-gray-200";
    }
    return <Badge className={`border ${color}`}>{status.replace('_', ' ')}</Badge>;
};

// Priority badge component
const PriorityBadge = ({ priority }) => {
    let color;
    switch (priority) {
        case "urgent":
            color = "bg-red-100 text-red-800 border-red-200";
            break;
        case "high":
            color = "bg-orange-100 text-orange-800 border-orange-200";
            break;
        case "normal":
            color = "bg-blue-100 text-blue-800 border-blue-200";
            break;
        case "low":
            color = "bg-gray-100 text-gray-800 border-gray-200";
            break;
        default:
            color = "bg-gray-100 text-gray-800 border-gray-200";
    }
    return <Badge variant="outline" className={color}>{priority?.toUpperCase()}</Badge>;
};

export default function MyTasksPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [employeeInfo, setEmployeeInfo] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentEmployee, setCurrentEmployee] = useState(null);

    useEffect(() => {
        // Get current user information
        const user = getCurrentUser();
        setCurrentUser(user);
        
        if (user) {
            // Check if user is admin - if so, fetch all assignments
            if (user.role === 'Admin' || user.role === 'General_Manager' || user.role === 'Order_Manager') {
                fetchAdminTasks();
            } else {
                // Find employee by email and then fetch their tasks
                fetchEmployeeByEmail(user.email);
            }
        } else {
            setError('Please log in to view your tasks');
            setLoading(false);
        }
    }, []);

    const fetchAdminTasks = async () => {
        try {
            setLoading(true);
            // Use the admin endpoint to fetch all assigned orders
            const response = await api.get('/orders/admin/all-assignments');
            setOrders(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching admin tasks:', err);
            console.error('Error details:', err.response?.data);
            if (err.response?.status === 401) {
                setError('Access denied. Please ensure you are logged in with admin privileges.');
            } else {
                setError('Failed to load assignments. Please make sure the backend server is running.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeByEmail = async (email) => {
        try {
            // Try to find employee by email
            const response = await api.get(`/hr/employees?email=${email}`);
            
            if (response.data && response.data.length > 0) {
                const employee = response.data[0];
                setCurrentEmployee(employee);
                fetchMyTasks(employee.employeeId);
                fetchEmployeeInfo(employee.employeeId);
            } else {
                // For users without employee records, create a mock employee or show appropriate message
                setError(`No employee record found for ${email}. Please contact HR to set up your employee profile.`);
                setLoading(false);
            }
        } catch (err) {
            console.error('Error fetching employee by email:', err);
            setError('Could not load employee information. Please try again or contact support.');
            setLoading(false);
        }
    };

    const fetchMyTasks = async (employeeId) => {
        try {
            setLoading(true);
            // Use the employeeId to fetch assigned orders
            const response = await api.get(`/orders/employee/${employeeId}`);
            setOrders(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching my tasks:', err);
            console.error('Error details:', err.response?.data);
            setError('Failed to load your assigned tasks. Please make sure the backend server is running.');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeInfo = async (employeeId) => {
        try {
            const response = await api.get(`/hr/employees/${employeeId}/profile`);
            setEmployeeInfo(response.data);
        } catch (err) {
            console.error('Error fetching employee info:', err);
        }
    };

    const updateTaskStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/${orderId}`, { 
                status: newStatus,
                tracking_notes: `Status updated to ${newStatus} by ${employeeInfo?.personalInfo?.firstName || currentUser?.name || 'Employee'}`
            });
            
            // Update employee workload if completing a task
            if (newStatus === 'Completed' && currentEmployee?.employeeId) {
                await api.post(`/hr/employees/${currentEmployee.employeeId}/workload/update`, {
                    action: 'complete',
                    orderId: orderId
                });
            }
            
            // Refresh the task list based on user role
            if (currentUser?.role === 'Admin' || currentUser?.role === 'General_Manager' || currentUser?.role === 'Order_Manager') {
                await fetchAdminTasks(); // Refresh admin tasks
            } else {
                await fetchMyTasks(currentEmployee?.employeeId); // Refresh employee tasks
            }
            
            alert('Task status updated successfully!');
        } catch (err) {
            console.error('Error updating task status:', err);
            alert('Failed to update task status');
        }
    };

    // Filter orders based on status
    const filteredOrders = orders.filter(order => {
        if (filterStatus === "all") return true;
        return order.status === filterStatus;
    });

    // Calculate statistics
    const stats = {
        total: orders.length,
        pending: orders.filter(o => ['New', 'Pending', 'Confirmed'].includes(o.status)).length,
        inProgress: orders.filter(o => ['In_Production', 'In Production', 'Quality_Check'].includes(o.status)).length,
        completed: orders.filter(o => ['Completed', 'Delivered'].includes(o.status)).length,
        urgent: orders.filter(o => o.priority === 'urgent').length
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                        <p className="mt-4 text-gray-600">Loading your tasks...</p>
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
                        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Tasks</h3>
                        <p className="text-gray-500 mb-4">{error}</p>
                        <Button onClick={() => {
                            if (currentUser?.role === 'Admin' || currentUser?.role === 'General_Manager' || currentUser?.role === 'Order_Manager') {
                                fetchAdminTasks();
                            } else {
                                fetchEmployeeByEmail(currentUser?.email);
                            }
                        }}>Try Again</Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="border-b border-gray-200 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                            <p className="text-gray-600">
                                {currentUser?.role === 'Admin' || currentUser?.role === 'General_Manager' || currentUser?.role === 'Order_Manager' ?
                                    "Admin view: All order assignments across the organization." :
                                    employeeInfo ? 
                                        `Welcome back, ${employeeInfo.personalInfo.firstName}! Here are your assigned orders.` :
                                        "Here are your assigned orders and tasks."
                                }
                            </p>
                        </div>
                        {employeeInfo && (
                            <Card className="w-72">
                                <CardContent className="pt-4">
                                    <div className="flex items-center space-x-3">
                                        <User className="h-8 w-8 text-gray-400" />
                                        <div>
                                            <p className="font-medium">
                                                {employeeInfo.personalInfo.firstName} {employeeInfo.personalInfo.lastName}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {employeeInfo.employment.position}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {employeeInfo.employment.department} Department
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Card className=" bg-[#ccffdd]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    
                    <Card className=" bg-[#b3d9ff]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                        </CardContent>
                    </Card>
                    
                    <Card className=" bg-[#ffffb3]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                        </CardContent>
                    </Card>
                    
                    <Card className=" bg-[#ffe6ff]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                        </CardContent>
                    </Card>
                    
                    <Card   className=" bg-[#ffc6b3]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Tasks</SelectItem>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Confirmed">Confirmed</SelectItem>
                            <SelectItem value="In_Production">In Production</SelectItem>
                            <SelectItem value="Quality_Check">Quality Check</SelectItem>
                            <SelectItem value="Ready_for_Pickup">Ready for Pickup</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Tasks Table */}
                <Card  >
                    <CardHeader>
                        <CardTitle>Assigned Tasks ({filteredOrders.length})</CardTitle>
                        <CardDescription>
                            Orders and tasks assigned to you
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-8">
                                <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                                <p className="text-gray-500">
                                    {filterStatus === "all" ? 
                                        "You don't have any assigned tasks at the moment." :
                                        `No tasks found with status: ${filterStatus.replace('_', ' ')}`
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Deadline</TableHead>
                                            <TableHead>Total Value</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredOrders.map((order) => (
                                            <TableRow key={order._id}>
                                                <TableCell className="font-medium">
                                                    {order.orderId}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{order.customer_name}</p>
                                                        {order.customer_phone && (
                                                            <p className="text-xs text-gray-500">{order.customer_phone}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p>{order.items?.length || 0} item(s)</p>
                                                        {order.items?.[0] && (
                                                            <p className="text-xs text-gray-500">
                                                                {order.items[0].product}
                                                                {order.items.length > 1 && ` +${order.items.length - 1} more`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <PriorityBadge priority={order.priority} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm">
                                                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                                        {order.delivery_date ? 
                                                            new Date(order.delivery_date).toLocaleDateString() : 
                                                            order.expected_completion_date ?
                                                            new Date(order.expected_completion_date).toLocaleDateString() :
                                                            'TBD'
                                                        }
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(order.final_amount || order.total)}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={order.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {order.status === 'Confirmed' && (
                                                            <Button className="bg-[#009900] text-[#ffffff] hover:bg-[#80ff80] hover:text-[#000000]"
                                                                size="sm" 
                                                                onClick={() => updateTaskStatus(order._id, 'In_Production')}
                                                            >
                                                                Start
                                                            </Button>
                                                        )}
                                                        {order.status === 'In_Production' && (
                                                            <Button className="bg-[#009900] text-[#ffffff] hover:bg-[#99c2ff] hover:text-[#000000]"
                                                                size="sm" 
                                                                onClick={() => updateTaskStatus(order._id, 'Quality_Check')}
                                                            >
                                                                QC
                                                            </Button>
                                                        )}
                                                        {order.status === 'Quality_Check' && (
                                                            <Button className="bg-[#9933ff] text-[#ffffff] hover:bg-#e6ccff] hover:text-[#000000]"
                                                                size="sm" 
                                                                onClick={() => updateTaskStatus(order._id, 'Ready_for_Pickup')}
                                                            >
                                                                Ready
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
