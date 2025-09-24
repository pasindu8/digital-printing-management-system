'use client';

import React, { useState, useEffect } from 'react';
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
import { MoreHorizontal, Search, User, AlertTriangle, ShoppingCart, DollarSign } from "lucide-react";
import api from '../services/api';
import { formatCurrency } from '@/lib/currency';

interface Customer {
  _id?: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  emailVerified?: boolean;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
}

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0
  });

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
      const customerUsers = allUsers.filter((user: Customer) => user.role === 'Customer');
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

  const handleViewDetails = (customer: Customer) => {
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
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading customers...</p>
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
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchCustomers}>Try Again</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-gray-600">Manage your customer relationships and orders</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">
                Database connected
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeOrders}</div>
              <p className="text-xs text-muted-foreground">
                Orders in progress
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                From completed orders
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
            <CardDescription>
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
                  className="pl-8"
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
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
    </MainLayout>
  );
};

export default CustomersPage;
