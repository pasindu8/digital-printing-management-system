'use client';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import api from '../services/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  User, 
  Edit2, 
  Trash2,
  Save
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
const logout = () => { 
  localStorage.removeItem('token'); 
  localStorage.removeItem('user'); 
  window.location.href='/login'; 
};

export default function Settings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Company Settings State
  const [companySettings, setCompanySettings] = useState({
    companyName: '',
    website: '',
    businessEmail: '',
    phone: '',
    address: '',
    taxId: '',
    currency: 'lkr',
    businessDescription: '',
    businessHours: {
      monday: { start: '8:00 AM', end: '5:00 PM' },
      tuesday: { start: '8:00 AM', end: '5:00 PM' },
      wednesday: { start: '8:00 AM', end: '5:00 PM' },
      thursday: { start: '8:00 AM', end: '5:00 PM' },
      friday: { start: '8:00 AM', end: '5:00 PM' },
      saturday: { start: '9:00 AM', end: '1:00 PM' },
      sunday: { start: 'Closed', end: 'Closed' }
    }
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    businessEmail: true,
    production: true,
    delivery: true,
    systemUpdates: false
  });

  // User Management State
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee'
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (!storedUser || !storedToken || storedUser === 'undefined' || storedUser === 'null') {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
      return;
    }

    fetchSettings();
    // Only fetch users if user is admin
    const userData = JSON.parse(storedUser);
    if (userData.role === 'Admin') {
      fetchUsers();
    }
  }, [router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings/company');
      const settings = response.data;
      
      setCompanySettings({
        companyName: settings.companyName,
        website: settings.website,
        businessEmail: settings.businessEmail,
        phone: settings.phone,
        address: settings.address,
        taxId: settings.taxId,
        currency: settings.currency,
        businessDescription: settings.businessDescription,
        businessHours: settings.businessHours
      });

      setNotificationSettings(settings.notifications);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/settings/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Don't show error for users if not admin
    }
  };

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setMessage(null);
    } else {
      setMessage(msg);
      setError(null);
    }
    setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 3000);
  };

  const saveCompanySettings = async () => {
    try {
      setSaving(true);
      await api.put('/settings/company', companySettings);
      showMessage('Company settings saved successfully!');
    } catch (error) {
      console.error('Error saving company settings:', error);
      showMessage('Failed to save company settings. Please try again.', true);
    } finally {
      setSaving(false);
    }
  };

  const saveBusinessHours = async () => {
    try {
      setSaving(true);
      await api.put('/settings/company/hours', companySettings.businessHours);
      showMessage('Business hours saved successfully!');
    } catch (error) {
      console.error('Error saving business hours:', error);
      showMessage('Failed to save business hours. Please try again.', true);
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      setSaving(true);
      await api.put('/settings/notifications', notificationSettings);
      showMessage('Notification settings saved successfully!');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      showMessage('Failed to save notification settings. Please try again.', true);
    } finally {
      setSaving(false);
    }
  };

  const createUser = async () => {
    try {
      setSaving(true);
      await api.post('/settings/users', newUser);
      showMessage('User created successfully!');
      setNewUser({ name: '', email: '', password: '', role: 'Employee' });
      setShowAddUser(false);
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      showMessage(error.response?.data?.message || 'Failed to create user. Please try again.', true);
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      setSaving(true);
      await api.put(`/settings/users/${userId}`, userData);
      showMessage('User updated successfully!');
      setEditingUser(null);
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      showMessage('Failed to update user. Please try again.', true);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      await api.delete(`/settings/users/${userId}`);
      showMessage('User deleted successfully!');
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showMessage('Failed to delete user. Please try again.', true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Messages */}
      {message && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          {currentUser?.role === 'Admin' && (
            <TabsTrigger value="users">Users</TabsTrigger>
          )}
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Manage your company details and business information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input 
                    id="company-name" 
                    placeholder="Your company name" 
                    value={companySettings.companyName}
                    onChange={(e) => setCompanySettings({...companySettings, companyName: e.target.value})}
                    readOnly={currentUser?.role !== 'Admin'}
                    className={currentUser?.role !== 'Admin' ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-website">Website</Label>
                  <Input 
                    id="company-website" 
                    placeholder="https://www.example.com" 
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings({...companySettings, website: e.target.value})}
                    readOnly={currentUser?.role !== 'Admin'}
                    className={currentUser?.role !== 'Admin' ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-email">Business Email</Label>
                  <Input 
                    id="business-email" 
                    type="email" 
                    placeholder="contact@example.com" 
                    value={companySettings.businessEmail}
                    onChange={(e) => setCompanySettings({...companySettings, businessEmail: e.target.value})}
                    readOnly={currentUser?.role !== 'Admin'}
                    className={currentUser?.role !== 'Admin' ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    placeholder="+1 (555) 000-0000" 
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})}
                    readOnly={currentUser?.role !== 'Admin'}
                    className={currentUser?.role !== 'Admin' ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea 
                    id="address" 
                    placeholder="Street Address, City, State, ZIP" 
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})}
                    readOnly={currentUser?.role !== 'Admin'}
                    className={currentUser?.role !== 'Admin' ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID / VAT Number</Label>
                  <Input 
                    id="tax-id" 
                    placeholder="Tax ID or VAT number" 
                    value={companySettings.taxId}
                    onChange={(e) => setCompanySettings({...companySettings, taxId: e.target.value})}
                    readOnly={currentUser?.role !== 'Admin'}
                    className={currentUser?.role !== 'Admin' ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select 
                    value={companySettings.currency}
                    onValueChange={(value) => setCompanySettings({...companySettings, currency: value})}
                    readOnly={currentUser?.role !== 'Admin'}
                    className={currentUser?.role !== 'Admin' ? 'bg-gray-50' : ''}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lkr">LKR (Rs)</SelectItem>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                      <SelectItem value="cad">CAD (C$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-description">Business Description</Label>
                <Textarea 
                  id="business-description" 
                  placeholder="Brief description of your printing business" 
                  value={companySettings.businessDescription}
                  onChange={(e) => setCompanySettings({...companySettings, businessDescription: e.target.value})}
                  readOnly={currentUser?.role !== 'Admin'}
                  className={currentUser?.role !== 'Admin' ? 'bg-gray-50' : ''}
                />
              </div>
            </CardContent>
            <CardFooter>
              {currentUser?.role === 'Admin' && (
                <Button onClick={saveCompanySettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Set your company's operating hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(companySettings.businessHours).map(([day, hours]) => (
                  <div key={day} className="space-y-2">
                    <Label className="capitalize">{day}</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Opening time" 
                        value={hours.start}
                        onChange={(e) => setCompanySettings({
                          ...companySettings,
                          businessHours: {
                            ...companySettings.businessHours,
                            [day]: { ...hours, start: e.target.value }
                          }
                        })}
                      />
                      <span className="flex items-center">to</span>
                      <Input 
                        placeholder="Closing time" 
                        value={hours.end}
                        onChange={(e) => setCompanySettings({
                          ...companySettings,
                          businessHours: {
                            ...companySettings.businessHours,
                            [day]: { ...hours, end: e.target.value }
                          }
                        })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              {currentUser?.role === 'Admin' && (
              <Button onClick={saveBusinessHours} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Hours
              </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        {currentUser?.role === 'Admin' && (
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Add, edit or remove system users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Current Users</h3>
                  
                </div>

                {showAddUser && (
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-base">Add New User</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-user-name">Name</Label>
                          <Input
                            id="new-user-name"
                            placeholder="Full name"
                            value={newUser.name}
                            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-user-email">Email</Label>
                          <Input
                            id="new-user-email"
                            type="email"
                            placeholder="user@example.com"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-user-password">Password</Label>
                          <Input
                            id="new-user-password"
                            type="password"
                            placeholder="Password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-user-role">Role</Label>
                          <Select 
                            value={newUser.role}
                            onValueChange={(value) => setNewUser({...newUser, role: value})}
                          >
                            <SelectTrigger id="new-user-role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Employee">Employee</SelectItem>
                              <SelectItem value="order_manager">Order Manager</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button onClick={createUser} disabled={saving || !newUser.name || !newUser.email || !newUser.password}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create User
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddUser(false)}>
                        Cancel
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                <div className="space-y-2">
                  {users.map((user) => (
                    <Card key={user._id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{user.name}</h4>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-500">Role: {user.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteUser(user._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage your notification preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="business-email-notifications">Business Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about new orders and inquiries
                    </p>
                  </div>
                  <Switch 
                    id="business-email-notifications" 
                    checked={notificationSettings.businessEmail}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, businessEmail: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="production-notifications">Production Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about production updates and issues
                    </p>
                  </div>
                  <Switch 
                    id="production-notifications" 
                    checked={notificationSettings.production}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, production: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="delivery-notifications">Delivery Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about delivery status changes
                    </p>
                  </div>
                  <Switch 
                    id="delivery-notifications" 
                    checked={notificationSettings.delivery}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, delivery: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="system-updates-notifications">System Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about system updates and maintenance
                    </p>
                  </div>
                  <Switch 
                    id="system-updates-notifications" 
                    checked={notificationSettings.systemUpdates}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemUpdates: checked})}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveNotificationSettings} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      <center>
        <Button className="items-center w-full max-w-[300px] h-[50px] mt-6" onClick={logout}>
          Logout
        </Button>
      </center>
    </MainLayout>
  );
}