'use client';

import React, { useState, useEffect } from 'react';
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { MoreHorizontal, Search, User, AlertTriangle, ShoppingCart, DollarSign, Menu } from "lucide-react";
import { Sidebar } from '@/components/layout/sidebar';
import api from '../services/api';
import { formatCurrency } from '@/lib/currency';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0
  });
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state
  const [sidebarMinimized, setSidebarMinimized] = useState(false); // Desktop sidebar minimize state

  // Sidebar functions
  const toggleSidebar = () => { setSidebarOpen(!sidebarOpen); };
  const toggleMinimize = () => { setSidebarMinimized(!sidebarMinimized); };

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings/users');
      // Filter only users with role 'Customer'
      const allUsers = response.data || [];
      const customerUsers = allUsers.filter((user) => user.role === 'Customer');
      setCustomers(customerUsers);
      setError(null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/orders/customer-stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching customer stats:', err);
      // Don't show error for stats, just keep default values
    }
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailsDialogOpen(true);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#049532] mx-auto"></div>
          <p className="text-lg text-gray-700 font-medium">Loading customers...</p>
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
            onClick={fetchCustomers}
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
                  <p className="text-xs text-gray-600">Customer Management</p>
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
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Customer Management
                    </h1>
                    <p className="text-xl text-slate-600 mt-2">
                      Manage your customer relationships and orders
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-700">Total Customers</CardTitle>
                    <User className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-800">{customers.length}</div>
                    <p className="text-xs text-slate-500">Database connected</p>
                  </CardContent>
                </Card>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-700">Active Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-800">{stats.activeOrders}</div>
                    <p className="text-xs text-slate-500">Orders in progress</p>
                  </CardContent>
                </Card>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-700">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalRevenue)}</div>
                    <p className="text-xs text-slate-500">From completed orders</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Modern Customer List Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-green-50/50 rounded-2xl blur-xl"></div>
              <Card className="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-slate-800">Customer List</CardTitle>
                  <CardDescription className="text-slate-600">
                    View and manage all your customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 bg-white/50 backdrop-blur-sm border-white/20"
                      />
                    </div>
                  </div>

                  {customers.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
                      <p className="text-gray-500 mb-4">Customers will appear here when they sign up</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-green-50/50">
                          <TableHead className="font-semibold text-slate-700">Name</TableHead>
                          <TableHead className="font-semibold text-slate-700">Email</TableHead>
                          <TableHead className="font-semibold text-slate-700">Status</TableHead>
                          <TableHead className="font-semibold text-slate-700">Provider</TableHead>
                          <TableHead className="font-semibold text-slate-700">Joined</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCustomers.map((customer) => (
                          <TableRow key={customer._id}>
                            <TableCell className="font-medium">
                              {customer.name}
                            </TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                customer.emailVerified 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {customer.emailVerified ? 'Verified' : 'Unverified'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="capitalize">
                                {customer.provider || 'local'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleViewDetails(customer)}>
                                    View Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>
                View detailed information about this customer.
              </DialogDescription>
            </DialogHeader>
            {selectedCustomer && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">User ID</label>
                    <p className="text-sm text-gray-600">{selectedCustomer._id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.role}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email Verified</label>
                    <p className="text-sm text-gray-600">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        selectedCustomer.emailVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedCustomer.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Account Status</label>
                    <p className="text-sm text-gray-600">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        selectedCustomer.active !== false 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedCustomer.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Provider</label>
                    <p className="text-sm text-gray-600 capitalize">{selectedCustomer.provider || 'local'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <p className="text-sm text-gray-600">{selectedCustomer.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Created Date</label>
                    <p className="text-sm text-gray-600">
                      {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Updated</label>
                    <p className="text-sm text-gray-600">
                      {selectedCustomer.updatedAt ? new Date(selectedCustomer.updatedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomersPage;
