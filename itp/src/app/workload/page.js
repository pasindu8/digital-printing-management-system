'use client';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { 
    Users, 
    UserCheck, 
    AlertTriangle, 
    TrendingUp,
    Clock,
    CheckCircle,
    Briefcase,
    Activity,
    Menu
} from "lucide-react";
import { Sidebar } from '@/components/layout/sidebar';
import api from '../services/api';

// Employee availability badge
const AvailabilityBadge = ({ availability }) => {
    let color;
    switch (availability) {
        case "Available":
            color = "bg-green-100 text-green-800 border-green-200";
            break;
        case "Busy":
            color = "bg-yellow-100 text-yellow-800 border-yellow-200";
            break;
        case "Overloaded":
            color = "bg-red-100 text-red-800 border-red-200";
            break;
        case "On Leave":
            color = "bg-gray-100 text-gray-800 border-gray-200";
            break;
        default:
            color = "bg-gray-100 text-gray-800 border-gray-200";
    }
    return <Badge variant="outline" className={color}>{availability}</Badge>;
};

// Department badge
const DepartmentBadge = ({ department }) => {
    const colors = {
        "Production": "bg-blue-100 text-blue-800",
        "Sales": "bg-green-100 text-green-800",
        "Administration": "bg-purple-100 text-purple-800",
        "Finance": "bg-yellow-100 text-yellow-800",
        "Delivery": "bg-orange-100 text-orange-800",
        "HR": "bg-pink-100 text-pink-800"
    };
    
    return (
        <Badge variant="outline" className={colors[department] || "bg-gray-100 text-gray-800"}>
            {department}
        </Badge>
    );
};

const normalizeAvailability = (value) => {
    const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (normalized.includes('leave')) return 'On Leave';
    if (normalized.includes('over')) return 'Overloaded';
    if (normalized.includes('busy') || normalized.includes('active') || normalized.includes('progress')) return 'Busy';
    return 'Available';
};

export default function WorkloadDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state
    const [sidebarMinimized, setSidebarMinimized] = useState(false); // Desktop sidebar minimize state

    // Sidebar functions
    const toggleSidebar = () => { setSidebarOpen(!sidebarOpen); };
    const toggleMinimize = () => { setSidebarMinimized(!sidebarMinimized); };

    useEffect(() => {
        fetchWorkloadData();
    }, []);

    const fetchWorkloadData = async () => {
        try {
            setLoading(true);
            const [dashboardResponse, employeesResponse] = await Promise.all([
                api.get('/hr/workload/dashboard'),
                api.get('/hr/employees?status=Active')
            ]);
            
            const rawSummary = dashboardResponse.data || {};
            const rawEmployees = Array.isArray(employeesResponse.data) ? employeesResponse.data : [];

            const normalizedEmployees = rawEmployees.map((employee, index) => {
                const personalInfo = employee.personalInfo || {};
                const employment = employee.employment || {};
                const workload = employee.workload || {};
                const normalizedAvailability = normalizeAvailability(workload.availability);

                return {
                    employeeId: employee.employeeId || employee._id || `EMP-${index}`,
                    personalInfo: {
                        firstName: personalInfo.firstName || personalInfo.name || 'Unknown',
                        lastName: personalInfo.lastName || personalInfo.surname || '',
                        email: personalInfo.email || 'not-provided@company.com',
                        phone: personalInfo.phone || 'Not provided'
                    },
                    employment: {
                        position: employment.position || 'Not specified',
                        department: employment.department || 'Not assigned',
                        hireDate: employment.hireDate || employee.createdAt || null,
                        status: employment.status || 'Active'
                    },
                    workload: {
                        assignedOrders: Number(workload.assignedOrders || 0),
                        activeOrders: Number(workload.activeOrders || 0),
                        completedOrders: Number(workload.completedOrders || 0),
                        availability: normalizedAvailability,
                        skills: Array.isArray(workload.skills) ? workload.skills : []
                    }
                };
            });

            const availabilityCounts = normalizedEmployees.reduce((acc, employee) => {
                const status = employee.workload.availability;
                if (status === 'Available') acc.available += 1;
                else if (status === 'Busy') acc.busy += 1;
                else if (status === 'Overloaded') acc.overloaded += 1;
                else if (status === 'On Leave') acc.onLeave += 1;
                else acc.available += 1;
                return acc;
            }, { available: 0, busy: 0, overloaded: 0, onLeave: 0 });

            const normalizedSummary = {
                totalEmployees: rawSummary.totalEmployees || rawSummary.activeEmployees || normalizedEmployees.length,
                availableEmployees: availabilityCounts.available,
                busyEmployees: availabilityCounts.busy,
                overloadedEmployees: availabilityCounts.overloaded,
                onLeaveEmployees: availabilityCounts.onLeave,
                totalAssignedOrders: rawSummary.totalAssigned || 0,
                totalActiveOrders: rawSummary.totalActive || 0,
                totalCompletedOrders: rawSummary.totalCompleted || 0,
                departmentWorkload: Object.fromEntries(
                    Object.entries(rawSummary.departmentWorkload || {}).map(([dept, data]) => ([
                        dept,
                        {
                            totalEmployees: data.employees || 0,
                            totalAssignedOrders: data.assigned || 0,
                            totalActiveOrders: data.active || 0,
                            totalCompletedOrders: data.completed || 0,
                            averageWorkload: data.averageWorkload || 0
                        }
                    ]))
                )
            };

            setDashboardData(normalizedSummary);
            setEmployees(normalizedEmployees);
            setError(null);
        } catch (err) {
            console.error('Error fetching workload data:', err);
            setError('Failed to load workload data. Please make sure the backend server is running.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
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

                {/* Main Content Area */}
                <div className={`flex-1 transition-all duration-300 ${sidebarMinimized ? 'lg:ml-16' : 'lg:ml-64'}`}>
                    {/* Header */}
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
                                        alt="First Promovier Logo"
                                        className="h-10 w-10 rounded-full"
                                    />
                                    <div>
                                        <h1 className="text-xl font-bold text-[#049532]">First Promovier</h1>
                                        <p className="text-xs text-gray-600">Employee Workload Dashboard</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Loading Content */}
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
                                <p className="mt-4 text-slate-600 font-medium">Loading workload dashboard...</p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (error) {
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

                {/* Main Content Area */}
                <div className={`flex-1 transition-all duration-300 ${sidebarMinimized ? 'lg:ml-16' : 'lg:ml-64'}`}>
                    {/* Header */}
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
                                        alt="First Promovier Logo"
                                        className="h-10 w-10 rounded-full"
                                    />
                                    <div>
                                        <h1 className="text-xl font-bold text-[#049532]">First Promovier</h1>
                                        <p className="text-xs text-gray-600">Employee Workload Dashboard</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Error Content */}
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 mb-2">Error Loading Dashboard</h3>
                                <p className="text-slate-500 mb-4">{error}</p>
                                <Button 
                                    onClick={fetchWorkloadData}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                                >
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    </main>
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
                                    <p className="text-xs text-gray-600">Employee Workload Dashboard</p>
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
                                        <Briefcase className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                            Employee Workload Dashboard
                                        </h1>
                                        <p className="text-xl text-slate-600 mt-2">
                                            Monitor employee assignments and workload distribution
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Overview Statistics */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                                <Card className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                                                <Users className="h-5 w-5 text-white" />
                                            </div>
                                            <CardTitle className="text-sm font-semibold text-slate-700">Total Employees</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-slate-800 mb-2">
                                            {dashboardData?.totalEmployees || 0}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Active staff members
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
                                                <UserCheck className="h-5 w-5 text-white" />
                                            </div>
                                            <CardTitle className="text-sm font-semibold text-slate-700">Available</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-slate-800 mb-2">
                                            {dashboardData?.availableEmployees || 0}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {dashboardData?.totalEmployees > 0 ? 
                                                `${Math.round((dashboardData.availableEmployees / dashboardData.totalEmployees) * 100)}% available` :
                                                '0% available'
                                            }
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
                                                <Clock className="h-5 w-5 text-white" />
                                            </div>
                                            <CardTitle className="text-sm font-semibold text-slate-700">Busy</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-slate-800 mb-2">
                                            {dashboardData?.busyEmployees || 0}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Working on tasks
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
                                            <CardTitle className="text-sm font-semibold text-slate-700">Overloaded</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-slate-800 mb-2">
                                            {dashboardData?.overloadedEmployees || 0}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Need attention
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                <Tabs defaultValue="employees" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="employees">Employee List</TabsTrigger>
                        <TabsTrigger value="departments">Department View</TabsTrigger>
                    </TabsList>

                    <TabsContent value="employees" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Employee Workload Overview</CardTitle>
                                <CardDescription>
                                    Current workload status for all active employees
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Department</TableHead>
                                                <TableHead>Position</TableHead>
                                                <TableHead>Active Orders</TableHead>
                                                <TableHead>Total Assigned</TableHead>
                                                <TableHead>Completed</TableHead>
                                                <TableHead>Availability</TableHead>
                                                <TableHead>Skills</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {employees.map((employee) => (
                                                <TableRow key={employee.employeeId}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">
                                                                {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {employee.employeeId}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <DepartmentBadge department={employee.employment.department} />
                                                    </TableCell>
                                                    <TableCell>
                                                        {employee.employment.position}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <Activity className="h-4 w-4 mr-1 text-blue-500" />
                                                            <span className="font-medium">
                                                                {employee.workload?.activeOrders || 0}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
                                                            {employee.workload?.assignedOrders || 0}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                                            {employee.workload?.completedOrders || 0}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <AvailabilityBadge 
                                                            availability={employee.workload?.availability || 'Available'} 
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {employee.workload?.skills?.length > 0 ? 
                                                                employee.workload.skills.slice(0, 2).map((skill, index) => (
                                                                    <Badge key={index} variant="secondary" className="text-xs">
                                                                        {skill}
                                                                    </Badge>
                                                                )) :
                                                                <span className="text-sm text-gray-400">None</span>
                                                            }
                                                            {employee.workload?.skills?.length > 2 && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    +{employee.workload.skills.length - 2}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="departments" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {dashboardData?.departmentWorkload && Object.entries(dashboardData.departmentWorkload).map(([dept, data]) => (
                                <Card key={dept}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span>{dept}</span>
                                            <DepartmentBadge department={dept} />
                                        </CardTitle>
                                        <CardDescription>
                                            Department workload overview
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Total Employees:</span>
                                            <span className="font-medium">{data.totalEmployees}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Active Orders:</span>
                                            <span className="font-medium">{data.totalActiveOrders}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Avg. Workload:</span>
                                            <span className="font-medium">
                                                {data.averageWorkload?.toFixed(1)} orders/person
                                            </span>
                                        </div>
                                        <div className="mt-3">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Workload Level</span>
                                                <span>{data.averageWorkload > 3 ? 'High' : data.averageWorkload > 1 ? 'Medium' : 'Low'}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full ${
                                                        data.averageWorkload > 3 ? 'bg-red-500' : 
                                                        data.averageWorkload > 1 ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}
                                                    style={{ width: `${Math.min((data.averageWorkload / 5) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
                    </div>
                </main>
            </div>
        </div>
    );
}
