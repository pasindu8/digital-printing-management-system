'use client';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Package, Calendar, DollarSign, Truck, AlertTriangle, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "@/components/layout/sidebar";
import api from "../services/api";
import { formatCurrency } from "@/lib/currency";

export default function MaterialOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: '',
    material_id: '',
    quantity_ordered: 0,
    unit_price: 0,
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    status: 'Ordered'
  });

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMinimize = () => setSidebarMinimized(!sidebarMinimized);

  // Check authentication
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (!storedUser || !storedToken || storedUser === 'undefined' || storedUser === 'null') {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = orders.filter(order =>
      order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.material_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      const [ordersRes, suppliersRes, materialsRes] = await Promise.all([
        api.get('/material-orders'),
        api.get('/suppliers'),
        api.get('/raw-materials')
      ]);
      setOrders(ordersRes.data);
      setSuppliers(suppliersRes.data);
      setMaterials(materialsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data from backend. Please check if the backend server is running on http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOrder) {
        await api.put(`/material-orders/${editingOrder.order_id}`, formData);
      } else {
        await api.post('/material-orders', formData);
      }
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handleDelete = async (orderId) => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        await api.delete(`/material-orders/${orderId}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      supplier_id: order.supplier_id,
      material_id: order.material_id,
      quantity_ordered: order.quantity_ordered,
      unit_price: order.unit_price,
      order_date: new Date(order.order_date).toISOString().split('T')[0],
      delivery_date: order.delivery_date ? new Date(order.delivery_date).toISOString().split('T')[0] : '',
      status: order.status
    });
    setIsDialogOpen(true);
  };

  const markDelivered = async (orderId) => {
    try {
      await api.post(`/material-orders/${orderId}/deliver`);
      fetchData();
    } catch (error) {
      console.error('Error marking as delivered:', error);
    }
  };

  const setDamaged = async (orderId) => {
    const damagedAmount = prompt('Enter damaged items amount:');
    if (damagedAmount !== null && !isNaN(damagedAmount)) {
      try {
        await api.post(`/material-orders/${orderId}/damaged`, { 
          damaged_items_amount: parseInt(damagedAmount) 
        });
        fetchData();
      } catch (error) {
        console.error('Error setting damaged items:', error);
      }
    }
  };

  const markTransferred = async (orderId) => {
    try {
      await api.post(`/material-orders/${orderId}/transfer`);
      fetchData();
    } catch (error) {
      console.error('Error marking as transferred:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      material_id: '',
      quantity_ordered: 0,
      unit_price: 0,
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      status: 'Ordered'
    });
    setEditingOrder(null);
    setIsDialogOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ordered': return 'bg-blue-100 text-blue-800';
      case 'In Transit': return 'bg-yellow-100 text-yellow-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFinanceColor = (status) => {
    return status === 'Transferred' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 w-full max-w-full overflow-x-hidden flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar}
          isMinimized={sidebarMinimized}
          toggleMinimize={toggleMinimize}
        />
        
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className={`flex-1 transition-all duration-300 ${sidebarMinimized ? 'lg:ml-16' : 'lg:ml-64'}`}>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
                <p className="mt-4 text-slate-600 font-medium">Loading material orders...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 w-full max-w-full overflow-x-hidden flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        isMinimized={sidebarMinimized}
        toggleMinimize={toggleMinimize}
      />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`flex-1 transition-all duration-300 ${sidebarMinimized ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <header className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
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
                  alt="Logo"
                  className="h-8 w-8"
                />
                <div>
                  <h1 className="text-xl font-bold text-[#049532]">First Promovier</h1>
                  <p className="text-xs text-gray-600">Material Orders</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Modern Header with Glassmorphism */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 via-emerald-600/10 to-teal-600/10 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        Material Orders
                      </h1>
                      <p className="text-xl text-slate-600 mt-2">
                        Manage material orders and deliveries
                      </p>
                    </div>
                  </div>
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        onClick={() => resetForm()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {editingOrder ? 'Edit Order' : 'Create New Order'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="supplier_id">Supplier</Label>
                          <Select value={formData.supplier_id} onValueChange={(value) => setFormData({...formData, supplier_id: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                            <SelectContent>
                              {suppliers.map((supplier) => (
                                <SelectItem key={supplier.supplier_id} value={supplier.supplier_id}>
                                  {supplier.supplier_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="material_id">Material</Label>
                          <Select value={formData.material_id} onValueChange={(value) => setFormData({...formData, material_id: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map((material) => (
                                <SelectItem key={material.material_id} value={material.material_id}>
                                  {material.material_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="quantity_ordered">Quantity</Label>
                          <Input
                            id="quantity_ordered"
                            type="number"
                            min="1"
                            value={formData.quantity_ordered}
                            onChange={(e) => setFormData({...formData, quantity_ordered: Number(e.target.value)})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="unit_price">Unit Price</Label>
                          <Input
                            id="unit_price"
                            type="number"
                            step="0.01"
                            min="1"
                            value={formData.unit_price}
                            onChange={(e) => setFormData({...formData, unit_price: Number(e.target.value)})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="order_date">Order Date</Label>
                          <Input
                            id="order_date"
                            type="date"
                            min={new Date(Date.now()).toISOString().split('T')[0]}
                            max={new Date(Date.now() + 31104000000).toISOString().split('T')[0]}
                            value={formData.order_date}
                            onChange={(e) => setFormData({...formData, order_date: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="delivery_date">Expected Delivery Date</Label>
                          <Input
                            id="delivery_date"
                            type="date"
                            min={new Date(Date.now()+ 172800000).toISOString().split('T')[0]}
                            max={new Date(Date.now() + 7776000000).toISOString().split('T')[0]}
                            value={formData.delivery_date}
                            onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={resetForm}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            {editingOrder ? 'Update' : 'Create'} Order
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-100/50 to-green-100/50 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50 backdrop-blur-sm border-white/20"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-white/50 backdrop-blur-sm border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Ordered">Ordered</SelectItem>
                      <SelectItem value="In Transit">In Transit</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Total Orders</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 mb-2">
                      {orders.length}
                    </div>
                    <p className="text-xs text-slate-500">
                      All material orders
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Pending Delivery</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 mb-2">
                      {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length}
                    </div>
                    <p className="text-xs text-slate-500">
                      Awaiting delivery
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Total Value</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 mb-2">
                      {formatCurrency(orders.reduce((sum, o) => sum + (o.total_price || 0), 0))}
                    </div>
                    <p className="text-xs text-slate-500">
                      Order value
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Pending Transfers</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 mb-2">
                      {orders.filter(o => o.finance_transfer_status === 'Pending').length}
                    </div>
                    <p className="text-xs text-slate-500">
                      Awaiting transfer
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Orders Grid */}
            <div className="grid gap-4">
              {filteredOrders.map((order) => {
                const supplier = suppliers.find(s => s.supplier_id === order.supplier_id);
                const material = materials.find(m => m.material_id === order.material_id);
                
                return (
                  <Card key={order.order_id} className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{order.order_id}</CardTitle>
                          <p className="text-sm text-gray-600">
                            {material?.material_name} from {supplier?.supplier_name}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <Badge className={getFinanceColor(order.finance_transfer_status)}>
                            {order.finance_transfer_status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Quantity</p>
                          <p className="font-medium">{order.quantity_ordered}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Unit Price</p>
                          <p className="font-medium">{formatCurrency(order.unit_price)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Price</p>
                          <p className="font-medium">{formatCurrency(order.total_price)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Damaged Items</p>
                          <p className="font-medium">{order.damaged_items_amount || 0}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Order Date</p>
                          <p className="font-medium">{new Date(order.order_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Delivery Date</p>
                          <p className="font-medium">
                            {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Not set'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                        <Button className="bg-[#00ccff] text-[#ffffff] hover:bg-[#99ebff] hover:text-[#000000]"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(order)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        )}
                        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                          <Button
                            className="bg-[#2eb82e] text-[#ffffff] hover:bg-[#adebad] hover:text-[#000000]"
                            variant="outline"
                            size="sm"
                            onClick={() => markDelivered(order.order_id)}
                          >
                            <Truck className="h-4 w-4 mr-1" />
                            Mark Delivered
                          </Button>
                        )}
                        {order.damaged_items_amount === 0 && order.status !== 'Ordered' && order.status !== 'Pending' && (
                        <Button className="bg-[#e68a00] text-[#ffffff] hover:bg-[#ffd699] hover:text-[#000000]"
                          variant="outline"
                          size="sm"
                          onClick={() => setDamaged(order.order_id)}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Set Damaged
                        </Button>
                        )}
                        {order.status !== 'Ordered' && order.status !== 'Transferred' && (
                          <Button className="bg-[#00e6b8] text-[#ffffff] hover:bg-[#99ffeb] hover:text-[#000000]"
                            variant="outline"
                            size="sm"
                            onClick={() => markTransferred(order.order_id)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Mark Transferred
                          </Button>
                        )}

                         {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                        <Button className="bg-[#e60000] text-[#ffffff] hover:bg-[#ff9999] hover:text-[#000000]"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(order.order_id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all" 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Create your first material order to get started.'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}