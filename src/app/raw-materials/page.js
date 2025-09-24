'use client';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import api from "../services/api";

export default function RawMaterials() {
  const router = useRouter();
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    material_name: '',
    material_type: '',
    unit_of_measurement: '',
    current_stock: 0,
    unit_cost: 0
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
    fetchMaterials();
  }, []);

  useEffect(() => {
    const filtered = materials.filter(material =>
      material.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.material_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.material_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMaterials(filtered);
  }, [materials, searchTerm]);

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/raw-materials');
      setMaterials(response.data);
      console.log('Fetched materials from backend:', response.data.length, 'items');
    } catch (error) {
      console.error('Error fetching materials:', error);
      // Show error message to user
      alert('Failed to fetch materials from backend. Please check if the backend server is running on http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await api.put(`/raw-materials/${editingMaterial.material_id}`, formData);
      } else {
        await api.post('/raw-materials', formData);
      }
      fetchMaterials();
      resetForm();
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const handleDelete = async (materialId) => {
    if (confirm('Are you sure you want to delete this material?')) {
      try {
        await api.delete(`/raw-materials/${materialId}`);
        fetchMaterials();
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      material_name: material.material_name,
      material_type: material.material_type,
      unit_of_measurement: material.unit_of_measurement,
      current_stock: material.current_stock,
      unit_cost: material.unit_cost || 0
    });
    setIsDialogOpen(true);
  };

  const adjustStock = async (materialId, delta) => {
    try {
      await api.patch(`/raw-materials/${materialId}/stock`, { delta });
      fetchMaterials();
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  const updateUnitPrice = async (materialId, unitCost) => {
    try {
      await api.put(`/raw-materials/${materialId}`, { unit_cost: unitCost });
      fetchMaterials();
    } catch (error) {
      console.error('Error updating unit price:', error);
      alert('Failed to update unit price');
    }
  };

  const resetForm = () => {
    setFormData({
      material_name: '',
      material_type: '',
      unit_of_measurement: '',
      current_stock: 0,
      unit_cost: 0
    });
    setEditingMaterial(null);
    setIsDialogOpen(false);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { color: 'destructive', text: 'Out of Stock' };
    if (stock < 50) return { color: 'destructive', text: 'Low Stock' };
    if (stock < 100) return { color: 'warning', text: 'Medium Stock' };
    return { color: 'success', text: 'In Stock' };
  };

  if (loading) return <MainLayout><div>Loading...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Raw Materials</h1>
          <p className="text-gray-600">Manage your raw material inventory</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? 'Edit Material' : 'Add New Material'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="material_name">Material Name</Label>
                <Input
                  id="material_name"
                  value={formData.material_name}
                  onChange={(e) => setFormData({...formData, material_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="material_type">Material Type</Label>
                <Input
                  id="material_type"
                  value={formData.material_type}
                  onChange={(e) => setFormData({...formData, material_type: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unit_of_measurement">Unit of Measurement</Label>
                <Input
                  id="unit_of_measurement"
                  value={formData.unit_of_measurement}
                  onChange={(e) => setFormData({...formData, unit_of_measurement: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="current_stock">Current Stock</Label>
                <Input
                  id="current_stock"
                  type="number"
                  min="0"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({...formData, current_stock: Number(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unit_cost">Unit Cost (Rs)</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({...formData, unit_cost: Number(e.target.value)})}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMaterial ? 'Update' : 'Add'} Material
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materials.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs {materials.reduce((total, m) => total + (m.current_stock * (m.unit_cost || 0)), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {materials.filter(m => m.current_stock < 50).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {materials.filter(m => m.current_stock === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materials Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMaterials.map((material) => {
          const stockStatus = getStockStatus(material.current_stock);
          return (
            <Card key={material.material_id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{material.material_name}</CardTitle>
                    <p className="text-sm text-gray-600">{material.material_id}</p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(material)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(material.material_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="text-sm font-medium">{material.material_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Unit:</span>
                    <span className="text-sm font-medium">{material.unit_of_measurement}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{material.current_stock}</span>
                      <Badge variant={stockStatus.color === 'success' ? 'default' : 'destructive'}>
                        {stockStatus.text}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Unit Price:</span>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={material.unit_cost || 0}
                        onChange={(e) => {
                          const newPrice = Number(e.target.value);
                          if (!isNaN(newPrice)) {
                            updateUnitPrice(material.material_id, newPrice);
                          }
                        }}
                        className="w-20 h-8 text-xs"
                      />
                      <span className="text-xs text-gray-500">Rs</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms.' : 'Add your first raw material to get started.'}
          </p>
        </div>
      )}
    </MainLayout>
  );
}
