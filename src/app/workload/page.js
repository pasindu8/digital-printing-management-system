'use client';
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    Activity
} from "lucide-react";
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

export default function WorkloadDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            
            setDashboardData(dashboardResponse.data);
            setEmployees(employeesResponse.data);
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
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                        <p className="mt-4 text-gray-600">Loading workload dashboard...</p>
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
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
                        <p className="text-gray-500 mb-4">{error}</p>
                        <button 
                            onClick={fetchWorkloadData}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-gray-200 pb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Employee Workload Dashboard</h1>
                    <p className="text-gray-600">Monitor employee assignments and workload distribution</p>
                </div>

                {/* Overview Statistics */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData?.totalEmployees || 0}</div>
                            <p className="text-xs text-muted-foreground">Active staff members</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Available</CardTitle>
                            <UserCheck className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {dashboardData?.availableEmployees || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {dashboardData?.totalEmployees > 0 ? 
                                    `${Math.round((dashboardData.availableEmployees / dashboardData.totalEmployees) * 100)}% available` :
                                    '0% available'
                                }
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Busy</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {dashboardData?.busyEmployees || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">Working on tasks</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overloaded</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {dashboardData?.overloadedEmployees || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">Need attention</p>
                        </CardContent>
                    </Card>
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
        </MainLayout>
    );
}
