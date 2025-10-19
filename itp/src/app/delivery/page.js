// Add this line at the very top of the file
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MapPin, MoreHorizontal, Search, Truck, Plus, Clock, User, FileText, Mail, LogOut, ChevronDown, RefreshCw, AlertTriangle, Menu } from "lucide-react";
import { Sidebar } from '@/components/layout/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from '../services/api';
import DeliveryMap from '@/components/DeliveryMap';
import { formatCurrency } from "@/lib/currency";
import { formatDeliveryAddress } from "@/lib/address";

// Function to determine status badge styling
const getStatusBadge = (status) => {
  switch (status) {
    case "Scheduled":
      return "bg-blue-50 text-blue-600 border-blue-200";
    case "In Transit":
      return "bg-purple-50 text-purple-600 border-purple-200";
    case "Delivered":
      return "bg-green-50 text-green-600 border-green-200";
    case "Pending Production":
      return "bg-yellow-50 text-yellow-600 border-yellow-200";
    case "Failed":
      return "bg-red-50 text-red-600 border-red-200";
    case "Cancelled":
      return "bg-gray-50 text-gray-600 border-gray-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
};

const getReadyOrderBadgeClass = (status) => {
  switch (status) {
    case 'Scheduled':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'Ready_for_Pickup':
      return 'bg-green-50 text-green-600 border-green-200';
    case 'Ready_for_Delivery':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const formatReadyOrderStatus = (status) => {
  if (!status) return 'Unknown';
  if (status === 'Scheduled') return 'Scheduled';
  return status.replace(/_/g, ' ');
};

const getDeliveryOrderId = (delivery) => {
  if (!delivery) return 'No Order ID';

  const directOrder = delivery.orderId;

  if (typeof directOrder === 'string' && directOrder.trim()) {
    return directOrder.trim();
  }

  if (directOrder?.orderId) {
    return directOrder.orderId;
  }

  const fallbackOrderId =
    delivery.items?.find((item) => typeof item?.orderId === 'string' && item.orderId.trim())?.orderId?.trim() ||
    delivery.orders?.find((order) => typeof order?.orderId === 'string' && order.orderId.trim())?.orderId?.trim();

  return fallbackOrderId || 'No Order ID';
};

const getDeliveryCoordinates = (delivery) => {
  if (!delivery) return null;

  const coordinateSource =
    delivery.coordinates ||
    delivery.customer?.address?.coordinates ||
    delivery.customer?.coordinates;

  if (!coordinateSource) {
    return null;
  }

  const parseValue = (value) => {
    if (value === null || value === undefined) return null;
    const numeric = typeof value === 'string' ? parseFloat(value) : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const lat = parseValue(coordinateSource.lat ?? coordinateSource.latitude);
  const lng = parseValue(coordinateSource.lng ?? coordinateSource.lon ?? coordinateSource.longitude);

  if (lat === null || lng === null) {
    return null;
  }

  const withinBounds = lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

  if (!withinBounds) {
    console.warn('Ignoring delivery coordinates outside map bounds', delivery.deliveryId, { lat, lng });
    return null;
  }

  return { lat, lng };
};

export default function Delivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [readyOrders, setReadyOrders] = useState([]);
  const [readyOrdersLoading, setReadyOrdersLoading] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedOrderForSchedule, setSelectedOrderForSchedule] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    scheduledDate: '',
    driverName: '',
    reason: ''
  });
  const [scheduleMode, setScheduleMode] = useState('schedule');

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state
  const [sidebarMinimized, setSidebarMinimized] = useState(false); // Desktop sidebar minimize state

  // Sidebar functions
  const toggleSidebar = () => { setSidebarOpen(!sidebarOpen); };
  const toggleMinimize = () => { setSidebarMinimized(!sidebarMinimized); };
  const [formData, setFormData] = useState({
    orderId: '',
    customer: {
      name: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      phone: ''
    },
    items: [{
      orderId: '',
      product: '',
      quantity: 1,
      weight: 0
    }],
    scheduledDate: new Date().toISOString().split('T')[0],
    driverName: '',
    vehicleId: '',
    deliveryNotes: '',
    signatureRequired: false
  });

  // User authentication
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && userData.email) {
          setUser(userData);
          const userRole = userData.role || localStorage.getItem('userRole');
          setIsCustomer(userRole === 'Customer');
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // If no valid user, redirect to login
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    if (user) {
      fetchDeliveries();
      
      // Only fetch ready orders for non-customer users
      if (!isCustomer) {
        fetchReadyOrders();
        fetchEmployees();
      }
    }
  }, [user, isCustomer]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    setUser(null);
    window.location.href = '/';
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDeliveries();
      setLastUpdated(new Date());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const response = await api.get('/hr/employees');
      const employeesData = response.data || [];
      
      // Filter for employees suitable for delivery (you can adjust this filter as needed)
      const deliveryEmployees = employeesData.filter(emp => 
        emp.employment?.status === 'Active' && 
        (emp.employment?.department === 'Production' || 
         emp.employment?.department === 'Operations' ||
         emp.employment?.position?.toLowerCase().includes('delivery') ||
         emp.employment?.position?.toLowerCase().includes('driver'))
      );
      
      setEmployees(deliveryEmployees);
    } catch (err) {
      console.error('Error fetching employees:', err);
      // Fallback: Use all employees if filtering fails
      try {
        const response = await api.get('/hr/employees');
        setEmployees(response.data || []);
      } catch (fallbackErr) {
        console.error('Failed to fetch employees:', fallbackErr);
        setEmployees([]);
      }
    } finally {
      setEmployeesLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view deliveries');
        setDeliveries([]);
        return;
      }

      // Check if user is a customer
      const userRole = localStorage.getItem('userRole');
      const isCustomer = userRole === 'Customer';
      
      // For customers, always use the authenticated endpoint that filters their data
      // For other roles, use the general endpoint (which now also handles filtering)
      const endpoint = '/delivery';  // Both endpoints now handle role-based filtering
      const response = await api.get(endpoint);
      
      const deliveriesData = response.data || [];
      setDeliveries(deliveriesData);
    setError(null);
      
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      
      // Provide more specific error messages
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        // Optionally redirect to login
        // window.location.href = '/login';
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to view deliveries.');
      } else if (err.response?.status === 404) {
        setError('Delivery service not available. Please try again later.');
      } else {
        setError('Failed to load deliveries. Please check your connection and try again.');
      }
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadyOrders = async () => {
    try {
      setReadyOrdersLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view ready orders');
        setReadyOrders([]);
        return;
      }

      const response = await api.get('/orders/ready-for-pickup');
      const ordersData = response.data || [];
      setReadyOrders(ordersData);
      
    } catch (err) {
      console.error('Error fetching ready orders:', err);
      // Don't set main error, just log it
    } finally {
      setReadyOrdersLoading(false);
    }
  };

  const completeOrder = async (orderId) => {
    try {
      const notes = prompt('Add completion notes (optional):');
      await api.put(`/orders/complete/${orderId}`, { 
        notes: notes || 'Order completed via delivery management'
      });
      
      // Refresh both lists
      await fetchReadyOrders();
      await fetchDeliveries();
      
      alert('Order completed successfully!');
    } catch (err) {
      console.error('Error completing order:', err);
      alert('Failed to complete order. Please try again.');
    }
  };

  const scheduleOrder = async (orderId) => {
    // Open scheduling dialog instead of directly scheduling
    setSelectedOrderForSchedule(orderId);
    setScheduleMode('schedule');
    setScheduleFormData({
      scheduledDate: '',
      driverName: '',
      reason: ''
    });
    setIsScheduleDialogOpen(true);
  };

  const handleRescheduleDelivery = (delivery) => {
    const orderId = delivery.orderId?._id || delivery.orderId;
    if (!orderId) {
      alert('Unable to identify the related order for this delivery.');
      return;
    }

    setSelectedOrderForSchedule(orderId);
    setScheduleMode('reschedule');
    setScheduleFormData({
      scheduledDate: delivery.scheduledDate
        ? new Date(delivery.scheduledDate).toISOString().split('T')[0]
        : '',
      driverName: delivery.driverName || '',
      reason: ''
    });
    setIsScheduleDialogOpen(true);
  };

  const handleScheduleSubmit = async () => {
    try {
      if (!scheduleFormData.scheduledDate || !scheduleFormData.driverName) {
        alert('Please fill in both scheduled date and driver name.');
        return;
      }

      const isReschedule = scheduleMode === 'reschedule';
      const noteParts = [];
      if (scheduleFormData.reason) {
        noteParts.push(`Reason: ${scheduleFormData.reason}`);
      }
      noteParts.push(`${isReschedule ? 'Rescheduled' : 'Scheduled'} by ${scheduleFormData.driverName}`);
      const deliveryNotes = noteParts.join(' | ');

      console.log('Scheduling delivery with data:', {
        orderId: selectedOrderForSchedule,
        scheduledDate: scheduleFormData.scheduledDate,
        driverName: scheduleFormData.driverName,
        estimatedTime: '09:00-17:00',
        deliveryNotes
      });

      // Call the delivery scheduling API
      await api.post('/delivery/schedule', {
        orderId: selectedOrderForSchedule,
        scheduledDate: scheduleFormData.scheduledDate,
        driverName: scheduleFormData.driverName,
        estimatedTime: '09:00-17:00', // Default time window
        deliveryNotes
      });
      
      // Close dialog and reset form
      setIsScheduleDialogOpen(false);
      setSelectedOrderForSchedule(null);
      setScheduleMode('schedule');
      setScheduleFormData({
        scheduledDate: '',
        driverName: '',
        reason: ''
      });
      
      // Refresh both lists
      await fetchReadyOrders();
      await fetchDeliveries();
      
      alert(isReschedule ? 'Delivery rescheduled successfully!' : 'Order scheduled successfully!');
    } catch (err) {
      console.error('Error scheduling order:', err);
      
      // Show more specific error message
      if (err.response?.data?.message) {
        alert(`Failed to schedule order: ${err.response.data.message}`);
      } else if (err.response?.status === 500) {
        alert('Server error occurred while scheduling. Please check the console for details.');
      } else {
        alert('Failed to schedule order. Please try again.');
      }
    }
  };

  const createDelivery = async () => {
    try {
      await api.post('/delivery', formData);
      setIsAddDialogOpen(false);
      await fetchDeliveries();
      setFormData({
        orderId: '',
        customer: {
          name: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: ''
          },
          phone: ''
        },
        items: [{
          orderId: '',
          product: '',
          quantity: 1,
          weight: 0
        }],
        scheduledDate: new Date().toISOString().split('T')[0],
        driverName: '',
        vehicleId: '',
        deliveryNotes: '',
        signatureRequired: false
      });
      alert('Delivery scheduled successfully!');
    } catch (err) {
      console.error('Error creating delivery:', err);
      alert('Failed to schedule delivery');
    }
  };

  const handleViewDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setIsDetailsDialogOpen(true);
  };

  const handleTrackDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    setIsTrackingDialogOpen(true);
  };

  const handleStatusUpdate = async (delivery, newStatus) => {
    try {
      await api.put(`/delivery/${delivery._id || delivery.deliveryId}`, {
        ...delivery,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      // Refresh deliveries to show updated status
      await fetchDeliveries();
      alert(`Delivery status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert('Failed to update delivery status');
    }
  };

  // Filter deliveries based on search query
  const filteredDeliveries = deliveries.filter((delivery) => {
    const customerName = delivery.customer?.name || '';
    const customerAddress = `${delivery.customer?.address?.street || ''} ${delivery.customer?.address?.city || ''}`;
    const deliveryId = delivery.deliveryId || '';
    const orderId = (getDeliveryOrderId(delivery) || '').toString();
    
    return (
      deliveryId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerAddress.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const mappedDeliveriesCount = filteredDeliveries.reduce((count, delivery) => (
    getDeliveryCoordinates(delivery) ? count + 1 : count
  ), 0);

  const readyForPickupOrders = readyOrders.filter(order => 
    order.status === 'Ready_for_Pickup' || order.status === 'Ready_for_Delivery'
  );
  const scheduledReadyOrders = readyOrders.filter(order => order.status === 'Scheduled');

  // Count deliveries by status
  const scheduled = deliveries.filter(d => d.status === "Scheduled").length + scheduledReadyOrders.length;
  const inTransit = deliveries.filter(d => d.status === "In Transit" || d.status === "Out_for_Delivery").length;
  const delivered = deliveries.filter(d => d.status === "Delivered" || d.status === "Completed").length;
  
  // Calculate today's deliveries
  const today = new Date().toISOString().split('T')[0];
  const todaysDeliveries = deliveries.filter(d => {
    const deliveryDate = new Date(d.scheduledDate).toISOString().split('T')[0];
    return deliveryDate === today;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#049532] border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p className="text-lg text-gray-700 font-medium">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          <p className="text-red-600 text-lg font-medium">{error}</p>
          <Button 
            onClick={fetchDeliveries}
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
                  <p className="text-xs text-gray-600">
                    {isCustomer ? 'My Deliveries' : 'Delivery Management'}
                  </p>
                </div>
              </div>

            {/* User Profile */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchDeliveries}
                disabled={loading}
                className="bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80 transition-all duration-300"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100">
                    <div className="w-8 h-8 bg-[#049532] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="text-gray-700 font-medium">
                      {user?.name || user?.email?.split('@')[0] || 'User'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/'}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Homepage</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/dashboard/customer'}>
                    <User className="mr-2 h-4 w-4" />
                    <span>My Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/orders'}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>My Orders</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/customer-billing'}>
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg">
                      <Truck className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {isCustomer ? 'My Deliveries' : 'Delivery Management'}
                      </h1>
                      <p className="text-xl text-slate-600 mt-2">
                        {isCustomer ? 'Track your delivery status and updates' : 'Track and manage delivery schedules'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Delivery Overview Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-700">
                      {!isCustomer ? 'Ready for Pickup' : 'Today\'s Deliveries'}
                    </CardTitle>
                    <Truck className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-800">
                      {!isCustomer ? readyForPickupOrders.length : todaysDeliveries}
                    </div>
                    <p className="text-xs text-slate-500">
                      {!isCustomer ? 'Orders ready for completion' : 'Scheduled for today'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-700">Scheduled</CardTitle>
                    <Truck className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-800">{scheduled}</div>
                    <p className="text-xs text-slate-500">Upcoming deliveries</p>
                  </CardContent>
                </Card>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-700">In Transit</CardTitle>
                    <Truck className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-800">{inTransit}</div>
                    <p className="text-xs text-slate-500">Currently being delivered</p>
                  </CardContent>
                </Card>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-700">Completed</CardTitle>
                    <Truck className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-800">{delivered}</div>
                    <p className="text-xs text-slate-500">Successfully delivered</p>
                  </CardContent>
                </Card>
              </div>
            </div>

        <Tabs defaultValue="all-deliveries" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all-deliveries">All Deliveries</TabsTrigger>
            {!isCustomer && <TabsTrigger value="ready-for-pickup">Ready for Pickup</TabsTrigger>}
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="in-transit">In Transit</TabsTrigger>
            <TabsTrigger value="map-view">Map View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-deliveries" className="space-y-4">
            {/* Search and Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  type="search" 
                  placeholder="Search deliveries by ID, order, customer, or address..." 
                  className="pl-10 bg-white border-gray-200 focus:border-[#049532] focus:ring-[#049532]" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant={autoRefresh ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={autoRefresh ? "bg-[#049532] hover:bg-[#049532]/90" : ""}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Auto Refresh
                </Button>
              </div>
            </div>

            {/* Auto-refresh Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-muted-foreground">
                    Auto-refresh: {autoRefresh ? 'ON (30s)' : 'OFF'}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
                <div className="text-muted-foreground">
                  Showing {filteredDeliveries.length} of {deliveries.length} deliveries
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Disable Auto-refresh' : 'Enable Auto-refresh'}
              </Button>
            </div>

            {/* Deliveries Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-[#049532]" />
                  {isCustomer ? 'My Deliveries' : 'All Deliveries'}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {filteredDeliveries.length} delivery{filteredDeliveries.length !== 1 ? 'ies' : ''} found
                </p>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Delivery ID</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer/Address</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Coordinates</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                <TableBody>
                  {filteredDeliveries.length > 0 ? (
                    filteredDeliveries.map((delivery) => {
                      const coordinates = getDeliveryCoordinates(delivery);
                      const mappedItemsPreview = Array.isArray(delivery.items)
                        ? delivery.items
                            .slice(0, 2)
                            .map((item) => `${item.product}${item.quantity ? ` (${item.quantity})` : ''}`)
                            .join(', ')
                        : '';

                      return (
                      <TableRow key={delivery._id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="text-sm">{delivery.deliveryId}</div>
                            {delivery.trackingNumber && (
                              <div className="text-xs text-muted-foreground">
                                Track: {delivery.trackingNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {getDeliveryOrderId(delivery)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {delivery.items?.length > 0 
                                ? `${delivery.items.length} item${delivery.items.length > 1 ? 's' : ''}` 
                                : 'No items'
                              }
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {mappedItemsPreview}
                              {delivery.items?.length > 2 && '...'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{delivery.customer?.name || 'Unknown'}</div>
                                <div className="flex items-start text-xs text-muted-foreground mt-1 gap-1">
                                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <div className="whitespace-pre-line break-words leading-snug">
                                    {formatDeliveryAddress(delivery.customer?.address, { multiline: true })}
                                  </div>
                                </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(delivery.scheduledDate).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(delivery.scheduledDate).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            {delivery.actualDeliveryTime && (
                              <div className="text-xs text-green-600 mt-1">
                                Delivered: {new Date(delivery.actualDeliveryTime).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadge(delivery.status)}>
                            {delivery.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{delivery.assignedTo?.name || delivery.driverName || 'Unassigned'}</div>
                            {delivery.assignedTo?.phone && (
                              <div className="text-xs text-muted-foreground">
                                {delivery.assignedTo.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {coordinates ? (
                              <div>
                                <div className="text-muted-foreground">Lat: {coordinates.lat.toFixed(4)}</div>
                                <div className="text-muted-foreground">Lng: {coordinates.lng.toFixed(4)}</div>
                                <div className="text-green-600 mt-1">📍 Mapped</div>
                              </div>
                            ) : delivery.customer?.address ? (
                              <div className="text-yellow-600">🔍 Needs Mapping</div>
                            ) : (
                              <div className="text-red-600">❌ No Address</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails(delivery)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTrackDelivery(delivery)}>
                                Track Delivery
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        {deliveries.length === 0 ? 'No deliveries found' : 'No deliveries match your search criteria'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ready-for-pickup" className="space-y-4">
            {/* Ready Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle>Orders Ready for Pickup/Delivery</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Orders that have completed production and are ready for pickup or delivery
                </p>
              </CardHeader>
              <CardContent>
                {readyOrdersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading ready orders...</span>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {readyForPickupOrders.length > 0 ? (
                          readyForPickupOrders.map((order) => (
                            <TableRow key={order._id}>
                              <TableCell className="font-medium">{order.orderId}</TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{order.customer.name}</div>
                                  <div className="text-sm text-muted-foreground">{order.customer.phone}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div>{order.items?.length || 0} item(s)</div>
                                  {order.items?.[0] && (
                                    <div className="text-sm text-muted-foreground">
                                      {order.items[0].product}
                                      {order.items.length > 1 && ` +${order.items.length - 1} more`}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`border ${getReadyOrderBadgeClass(order.status)}`}>
                                  {formatReadyOrderStatus(order.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {formatCurrency(order.total || 0)}
                              </TableCell>
                              <TableCell>
                                {order.scheduledDate ? 
                                  new Date(order.scheduledDate).toLocaleDateString() : 
                                  'TBD'
                                }
                              </TableCell>
                              <TableCell>
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => scheduleOrder(order._id)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Scheduled
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                              No orders ready for pickup found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="scheduled" className="space-y-4">
            {/* Scheduled Deliveries */}
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Deliveries</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Regular scheduled deliveries and orders ready for pickup
                </p>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Delivery ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items/Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Show regular scheduled deliveries */}
                      {deliveries.filter(d => d.status === 'Scheduled').map((delivery) => (
                        <TableRow key={delivery._id}>
                          <TableCell className="font-medium">{delivery.deliveryId}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{delivery.customer?.name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">{delivery.customer?.phone || ''}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{delivery.items?.length || 0} item(s)</div>
                              {delivery.items?.[0] && (
                                <div className="text-sm text-muted-foreground">
                                  {delivery.items[0].product}
                                  {delivery.items.length > 1 && ` +${delivery.items.length - 1} more`}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-50 text-blue-600 border-blue-200">
                              Scheduled
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {delivery.scheduledDate ? 
                              new Date(delivery.scheduledDate).toLocaleDateString() : 
                              'TBD'
                            }
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => handleViewDetails(delivery)}>
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Show empty state if no scheduled items */}
                      {deliveries.filter(d => d.status === 'Scheduled').length === 0 && scheduledReadyOrders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            No scheduled deliveries or ready orders found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="in-transit" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>In Transit Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Delivery ID</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Scheduled Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveries
                        .filter(d => d.status === "In Transit" || d.status === "Out_for_Delivery")
                        .filter((delivery) => {
                          const customerName = delivery.customer?.name || '';
                          const customerAddress = `${delivery.customer?.address?.street || ''} ${delivery.customer?.address?.city || ''}`;
                          const deliveryId = delivery.deliveryId || '';
                          const orderId = (getDeliveryOrderId(delivery) || '').toString();
                          
                          return (
                            deliveryId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            customerAddress.toLowerCase().includes(searchQuery.toLowerCase())
                          );
                        })
                        .map((delivery) => (
                        <TableRow key={delivery._id || delivery.deliveryId}>
                          <TableCell className="font-medium">
                            {delivery.deliveryId || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {getDeliveryOrderId(delivery)}
                          </TableCell>
                          <TableCell>{delivery.customer?.name || 'N/A'}</TableCell>
                          <TableCell className="align-top">
                            <div className="text-sm whitespace-pre-line break-words">
                              {formatDeliveryAddress(delivery.customer?.address, { multiline: true })}
                            </div>
                            {delivery.customer?.phone && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {delivery.customer.phone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{delivery.driverName || 'Not assigned'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(delivery.status)}>
                              {delivery.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {delivery.scheduledDate 
                              ? new Date(delivery.scheduledDate).toLocaleDateString()
                              : 'Not scheduled'
                            }
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
                                <DropdownMenuItem onClick={() => handleViewDetails(delivery)}>
                                  View details
                                </DropdownMenuItem>
                                  {!isCustomer && (
                                    <DropdownMenuItem onClick={() => handleRescheduleDelivery(delivery)}>
                                      ReScheduled
                                    </DropdownMenuItem>
                                  )}
                                <DropdownMenuItem onClick={() => handleTrackDelivery(delivery)}>
                                  Track delivery
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {!isCustomer && (
                                  <DropdownMenuItem onClick={() => handleStatusUpdate(delivery, "Delivered")}>
                                    Mark as delivered
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {deliveries.filter(d => d.status === "In Transit" || d.status === "Out_for_Delivery").length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            <div className="text-muted-foreground">
                              <Truck className="mx-auto h-8 w-8 mb-2 opacity-50" />
                              No deliveries currently in transit
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="map-view" className="pt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Delivery Map</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Map Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{deliveries.length}</div>
                      <div className="text-sm text-muted-foreground">Total Deliveries</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {mappedDeliveriesCount}
                      </div>
                      <div className="text-sm text-muted-foreground">Mapped Locations</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {deliveries.filter(d => d.status === 'In Transit' || d.status === 'Out_for_Delivery').length}
                      </div>
                      <div className="text-sm text-muted-foreground">In Transit</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {deliveries.filter(d => d.status === 'Scheduled').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Scheduled</div>
                    </div>
                  </Card>
                </div>

                {/* Real-time Status */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-4 text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Live Delivery Tracking</span>
                    </div>
                    <div className="text-muted-foreground">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                    <div className="text-muted-foreground">
                      Auto-refresh: {autoRefresh ? 'ON (30s)' : 'OFF'}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white">
                    {mappedDeliveriesCount} locations mapped
                  </Badge>
                </div>
                
                <DeliveryMap 
                  deliveries={filteredDeliveries} 
                  onDeliveryClick={handleViewDetails}
                  key={`delivery-map-${deliveries.length}-${lastUpdated.getTime()}`}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Delivery Dialog - Only show for non-customers */}
        {!isCustomer && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Schedule New Delivery</DialogTitle>
              <DialogDescription>
                Create a new delivery schedule entry.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="orderId" className="text-sm font-medium">
                    Order ID
                  </label>
                  <Input
                    id="orderId"
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="scheduledDate" className="text-sm font-medium">
                    Scheduled Date
                  </label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="customerName" className="text-sm font-medium">
                  Customer Name
                </label>
                <Input
                  id="customerName"
                  value={formData.customer.name}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    customer: { ...formData.customer, name: e.target.value }
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="street" className="text-sm font-medium">
                    Street Address
                  </label>
                  <Input
                    id="street"
                    value={formData.customer.address.street}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      customer: { 
                        ...formData.customer, 
                        address: { ...formData.customer.address, street: e.target.value }
                      }
                    })}
                  />
                </div>
                <div>
                  <label htmlFor="city" className="text-sm font-medium">
                    City
                  </label>
                  <Input
                    id="city"
                    value={formData.customer.address.city}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      customer: { 
                        ...formData.customer, 
                        address: { ...formData.customer.address, city: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="state" className="text-sm font-medium">
                    State
                  </label>
                  <Input
                    id="state"
                    value={formData.customer.address.state}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      customer: { 
                        ...formData.customer, 
                        address: { ...formData.customer.address, state: e.target.value }
                      }
                    })}
                  />
                </div>
                <div>
                  <label htmlFor="zipCode" className="text-sm font-medium">
                    ZIP Code
                  </label>
                  <Input
                    id="zipCode"
                    type="number"
                    value={formData.customer.address.zipCode}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      customer: { 
                        ...formData.customer, 
                        address: { ...formData.customer.address, zipCode: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.customer.phone}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      customer: { ...formData.customer, phone: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label htmlFor="driverName" className="text-sm font-medium">
                    Driver Name
                  </label>
                  <Input
                    id="driverName"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="vehicleId" className="text-sm font-medium">
                    Vehicle ID
                  </label>
                  <Input
                    id="vehicleId"
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="product" className="text-sm font-medium">
                    Product
                  </label>
                  <Input
                    id="product"
                    value={formData.items[0].product}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      items: [{ ...formData.items[0], product: e.target.value }]
                    })}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="deliveryNotes" className="text-sm font-medium">
                  Delivery Notes
                </label>
                <Textarea
                  id="deliveryNotes"
                  value={formData.deliveryNotes}
                  onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createDelivery}>Schedule Delivery</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}

        {/* Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Delivery Details</DialogTitle>
              <DialogDescription>
                View detailed information about this delivery.
              </DialogDescription>
            </DialogHeader>
            {selectedDelivery && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Delivery ID</label>
                    <p className="text-sm text-gray-600">{selectedDelivery.deliveryId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Order ID</label>
                    <p className="text-sm text-gray-600">{getDeliveryOrderId(selectedDelivery)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Customer</label>
                    <p className="text-sm text-gray-600">{selectedDelivery.customer?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="mt-1">
                      <Badge variant="outline" className={getStatusBadge(selectedDelivery.status)}>
                        {selectedDelivery.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Scheduled Date</label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedDelivery.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Driver</label>
                    <p className="text-sm text-gray-600">{selectedDelivery.assignedTo?.name || selectedDelivery.driverName || 'Unassigned'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Delivery Address</label>
                  <p className="text-sm text-gray-600 whitespace-pre-line break-words">
                    {formatDeliveryAddress(selectedDelivery.customer?.address, { multiline: true })}
                  </p>
                </div>
                {selectedDelivery.deliveryNotes && (
                  <div>
                    <label className="text-sm font-medium">Delivery Notes</label>
                    <p className="text-sm text-gray-600">{selectedDelivery.deliveryNotes}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Items</label>
                  <div className="mt-2 space-y-2">
                    {selectedDelivery.items?.map((item, index) => (
                      <div key={index} className="border rounded p-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium">Product:</span>
                            <span className="text-sm text-gray-600 ml-2">{item.product}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Quantity:</span>
                            <span className="text-sm text-gray-600 ml-2">{item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    )) || <p className="text-gray-500">No items</p>}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Track Delivery Dialog */}
        <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Track Delivery</DialogTitle>
            </DialogHeader>
            {selectedDelivery && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Delivery ID</label>
                  <p className="text-sm text-gray-600">{selectedDelivery.deliveryId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Order ID</label>
                  <p className="text-sm text-gray-600">{getDeliveryOrderId(selectedDelivery)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Current Status</label>
                  <p className="text-sm text-gray-600 capitalize">
                    {selectedDelivery.status?.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Delivery Address</label>
                  <p className="text-sm text-gray-600">
                    {formatDeliveryAddress(selectedDelivery.customer?.address, { multiline: true })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Estimated Delivery</label>
                  <p className="text-sm text-gray-600">
                    {selectedDelivery.delivery_date 
                      ? new Date(selectedDelivery.delivery_date).toLocaleDateString() 
                      : 'Not scheduled'}
                  </p>
                </div>
                {selectedDelivery.tracking_info && (
                  <div>
                    <label className="text-sm font-medium">Tracking Information</label>
                    <p className="text-sm text-gray-600">{selectedDelivery.tracking_info}</p>
                  </div>
                )}
                
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Schedule Order Dialog */}
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {scheduleMode === 'reschedule' ? 'Reschedule Delivery' : 'Schedule Delivery'}
              </DialogTitle>
              <DialogDescription>
                {scheduleMode === 'reschedule'
                  ? 'Update the delivery details and provide a reason for the change.'
                  : 'Set the scheduled date and assign a driver for this order.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Scheduled Date</label>
                <Input
                  type="date"
                  value={scheduleFormData.scheduledDate}
                  onChange={(e) => setScheduleFormData({
                    ...scheduleFormData,
                    scheduledDate: e.target.value
                  })}
                  className="mt-1"
                  min={(scheduleMode === 'reschedule'
                    ? new Date().toISOString().split('T')[0]
                    : new Date(Date.now() + 86400000).toISOString().split('T')[0])}
                  max={new Date(Date.now() + 1209600000).toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Driver/Employee</label>
                <Select
                  value={scheduleFormData.driverName}
                  onValueChange={(value) => setScheduleFormData({
                    ...scheduleFormData,
                    driverName: value
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={employeesLoading ? "Loading employees..." : "Select an employee"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employeesLoading ? (
                      <SelectItem value="" disabled>Loading employees...</SelectItem>
                    ) : employees.length > 0 ? (
                      employees.map((employee) => (
                        <SelectItem 
                          key={employee.employeeId || employee._id} 
                          value={`${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim()}
                        >
                          {`${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim()} 
                          {employee.employment?.department && ` (${employee.employment.department})`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>No employees available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {scheduleMode === 'reschedule' && (
                <div>
                  <label className="text-sm font-medium">Reason (optional)</label>
                  <Textarea
                    value={scheduleFormData.reason}
                    onChange={(e) => setScheduleFormData({
                      ...scheduleFormData,
                      reason: e.target.value
                    })}
                    placeholder="Provide context for the reschedule (e.g., customer request, vehicle maintenance)"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsScheduleDialogOpen(false);
                  setScheduleMode('schedule');
                  setSelectedOrderForSchedule(null);
                  setScheduleFormData({
                    scheduledDate: '',
                    driverName: '',
                    reason: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleScheduleSubmit}>
                {scheduleMode === 'reschedule' ? 'Reschedule Delivery' : 'Schedule Delivery'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
