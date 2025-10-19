'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Plus, Search, AlertTriangle, Edit, Trash2, Menu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sidebar } from "@/components/layout/sidebar";
import api from '../services/api';

export default function RawMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    material_name: '',
    material_type: '',
    category: '',
    unit_of_measurement: '',
    supplier_name: '',
    current_stock: '',
    minimum_stock_level: '',
    unit_cost: '',
    restock_threshold: '',
    description: ''
  });

  const router = useRouter();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMinimize = () => setSidebarMinimized(!sidebarMinimized);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchMaterials();
  }, [router]);

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/raw-materials');
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitFormData = new FormData();
      Object.keys(formData).forEach(key => {
        submitFormData.append(key, formData[key]);
      });
      
      // Append image if selected
      if (selectedImage) {
        submitFormData.append('image', selectedImage);
      }

      if (editingMaterial) {
        await api.put(`/raw-materials/${editingMaterial.material_id}`, submitFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        await api.post('/raw-materials', submitFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      fetchMaterials();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const handleEdit = (material) => {
    setFormData({
      material_name: material.material_name || '',
      material_type: material.material_type || '',
      category: material.category || '',
      unit_of_measurement: material.unit_of_measurement || '',
      supplier_name: material.supplier_name || '',
      current_stock: material.current_stock || '',
      minimum_stock_level: material.minimum_stock_level || '',
      unit_cost: material.unit_cost || '',
      restock_threshold: material.restock_threshold || '',
      description: material.description || ''
    });
    setEditingMaterial(material);
    // Set image preview if material has image
    if (material.image) {
      setImagePreview(material.image);
    }
    setIsDialogOpen(true);
  };

  const updateUnitPrice = async (materialId, unitCost) => {
    try {
      await api.put(`/raw-materials/${materialId}`, { unit_cost: unitCost });
      fetchMaterials();
    } catch (error) {
      console.error('Error updating unit price:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      material_name: '',
      material_type: '',
      category: '',
      unit_of_measurement: '',
      supplier_name: '',
      current_stock: '',
      minimum_stock_level: '',
      unit_cost: '',
      restock_threshold: '',
      description: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
    setEditingMaterial(null);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { color: 'destructive', text: 'Out of Stock', bgColor: '#ff0000' };
    if (stock < 50) return { color: 'destructive', text: 'Low Stock', bgColor: '#ff9900' };
    if (stock < 100) return { color: 'warning', text: 'Medium Stock', bgColor: '#ace600' };
    return { color: 'success', text: 'In Stock', bgColor: '#33cc33' };
  };

  const filteredMaterials = materials.filter(material =>
    material.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.material_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <p className="mt-4 text-slate-600 font-medium">Loading materials...</p>
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
                  <p className="text-xs text-gray-600">Raw Materials</p>
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
                        Raw Materials
                      </h1>
                      <p className="text-xl text-slate-600 mt-2">
                        Manage your raw material inventory
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
                        Add Material
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                          <Label htmlFor="category">Category</Label>
                          <select
                            id="category"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          >
                            <option value="">Select Category</option>
                            <option value="Ink">Ink</option>
                            <option value="Paper">Paper</option>
                            <option value="Adhesive">Adhesive</option>
                            <option value="Chemical">Chemical</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Packaging">Packaging</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="unit_of_measurement">Unit of Measurement</Label>
                          <Input
                            id="unit_of_measurement"
                            value={formData.unit_of_measurement}
                            onChange={(e) => setFormData({...formData, unit_of_measurement: e.target.value})}
                            placeholder="e.g., kg, liters, meters, pieces"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="supplier_name">Supplier Name</Label>
                          <Input
                            id="supplier_name"
                            value={formData.supplier_name}
                            onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="current_stock">Current Stock</Label>
                            <Input
                              id="current_stock"
                              type="number"
                              value={formData.current_stock}
                              onChange={(e) => setFormData({...formData, current_stock: Number(e.target.value)})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="minimum_stock_level">Minimum Stock Level</Label>
                            <Input
                              id="minimum_stock_level"
                              type="number"
                              value={formData.minimum_stock_level}
                              onChange={(e) => setFormData({...formData, minimum_stock_level: Number(e.target.value)})}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="unit_cost">Unit Cost (Rs)</Label>
                            <Input
                              id="unit_cost"
                              type="number"
                              step="0.01"
                              value={formData.unit_cost}
                              onChange={(e) => setFormData({...formData, unit_cost: Number(e.target.value)})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="restock_threshold">Restock Threshold</Label>
                            <Input
                              id="restock_threshold"
                              type="number"
                              value={formData.restock_threshold}
                              onChange={(e) => setFormData({...formData, restock_threshold: Number(e.target.value)})}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                            placeholder="Enter material description..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="image">Material Image</Label>
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              setSelectedImage(file);
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => setImagePreview(e.target.result);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          {imagePreview && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 mb-1">Preview:</p>
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="w-32 h-32 object-cover rounded-md border"
                              />
                            </div>
                          )}
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
              </div>
            </div>

            {/* Search Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-100/50 to-green-100/50 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search materials..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50 backdrop-blur-sm border-white/20"
                    />
                  </div>
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
                      <CardTitle className="text-sm font-semibold text-slate-700">Total Materials</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 mb-2">
                      {materials.length}
                    </div>
                    <p className="text-xs text-slate-500">
                      Active inventory items
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
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Total Value</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 mb-2">
                      Rs. {materials.reduce((sum, material) => sum + (material.current_stock * material.unit_cost || 0), 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-500">
                      Total inventory value
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
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-slate-700">Low Stock Items</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 mb-2">
                      {materials.filter(material => material.current_stock <= material.minimum_stock_level).length}
                    </div>
                    <p className="text-xs text-slate-500">
                      Items below threshold
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
                      <CardTitle className="text-sm font-semibold text-slate-700">Out of Stock</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 mb-2">
                      {materials.filter(material => material.current_stock === 0).length}
                    </div>
                    <p className="text-xs text-slate-500">
                      Critical items
                    </p>
                  </CardContent>
                </Card>
              </div>
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
                          <Button className="bg-[#29a329] text-white"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(material)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {material.image && (
                          <div className="flex justify-center">
                            <img 
                              src={material.image} 
                              alt={material.material_name}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        
                        <div>
                          <p className="text-sm text-gray-700">{material.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Type:</span>
                            <span className="text-sm font-medium">{material.material_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Unit:</span>
                            <span className="text-sm font-medium">{material.unit_of_measurement}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Stock:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{material.current_stock}</span>
                              <Badge 
                                variant={stockStatus.color}
                                style={{ backgroundColor: stockStatus.bgColor, color: 'white' }}
                              >
                                {stockStatus.text}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Unit Price:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Rs</span>
                              <input
                                type="number"
                                defaultValue={material.unit_cost}
                                onBlur={(e) => {
                                  const newPrice = parseFloat(e.target.value);
                                  if (!isNaN(newPrice)) {
                                    updateUnitPrice(material.material_id, newPrice);
                                  }
                                }}
                                className="w-20 h-8 text-xs"
                              />
                            </div>
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
          </div>
        </main>
      </div>
    </div>
  );
}