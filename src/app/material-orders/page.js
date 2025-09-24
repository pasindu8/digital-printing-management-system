'use client';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Package, Calendar, DollarSign, Truck, AlertTriangle } from 'lucide-react';
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      console.log('Fetched data from backend:', {
        orders: ordersRes.data.length,
        suppliers: suppliersRes.data.length,
        materials: materialsRes.data.length
      });
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

  if (loading) return <MainLayout><div>Loading...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Material Orders</h1>
          <p className="text-gray-600">Manage material orders and deliveries</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
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
                  min="0"
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
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ordered">Ordered</SelectItem>
                    <SelectItem value="In Transit">In Transit</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Search and Filters */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
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
            <CardTitle className="text-sm font-medium">Pending Delivery</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(orders.reduce((sum, o) => sum + (o.total_price || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transfers</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.finance_transfer_status === 'Pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
      <div className="grid gap-4">
        {filteredOrders.map((order) => {
          const supplier = suppliers.find(s => s.supplier_id === order.supplier_id);
          const material = materials.find(m => m.material_id === order.material_id);
          
          return (
            <Card key={order.order_id}>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(order)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markDelivered(order.order_id)}
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      Mark Delivered
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDamaged(order.order_id)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Set Damaged
                  </Button>
                  {order.finance_transfer_status === 'Pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markTransferred(order.order_id)}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Mark Transferred
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(order.order_id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
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
    </MainLayout>
  );
}
