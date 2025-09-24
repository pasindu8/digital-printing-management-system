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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Clock, Calendar, CheckCircle, XCircle, Plus, Edit, Trash2 } from "lucide-react";
import api from '../services/api';

export default function HRPage() {
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
    const [isLeaveFormOpen, setIsLeaveFormOpen] = useState(false);
    const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);

    useEffect(() => {
        fetchHRData();
    }, []);

    const fetchHRData = async () => {
        try {
            setLoading(true);
            const [employeesRes, attendanceRes, leavesRes, salariesRes] = await Promise.all([
                api.get('/hr/employees'),
                api.get('/hr/attendance'),
                api.get('/hr/leaves'),
                api.get('/hr/salaries').catch(() => ({ data: [] })) // Add fallback for salary endpoint
            ]);
            
            setEmployees(employeesRes.data || []);
            setAttendance(attendanceRes.data || []);
            setLeaves(leavesRes.data || []);
            setSalaries(salariesRes.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching HR data:', err);
            setError('Failed to load HR data');
        } finally {
            setLoading(false);
        }
    };

    const clockIn = async (employeeId) => {
        try {
            await api.post('/hr/attendance/clock-in', { employeeId });
            fetchHRData();
            alert('Clocked in successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to clock in');
        }
    };

    const clockOut = async (employeeId) => {
        try {
            await api.post('/hr/attendance/clock-out', { employeeId });
            fetchHRData();
            alert('Clocked out successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to clock out');
        }
    };

    const approveLeave = async (leaveId) => {
        try {
            await api.patch(`/hr/leaves/${leaveId}`, { status: 'Approved' });
            fetchHRData();
            alert('Leave approved successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve leave');
        }
    };

    const rejectLeave = async (leaveId) => {
        try {
            await api.patch(`/hr/leaves/${leaveId}`, { status: 'Rejected' });
            fetchHRData();
            alert('Leave rejected successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject leave');
        }
    };

    const deleteEmployee = async () => {
        if (!employeeToDelete) return;
        
        try {
            await api.delete(`/hr/employees/${employeeToDelete.employeeId}`);
            fetchHRData();
            setIsDeleteDialogOpen(false);
            setEmployeeToDelete(null);
            alert('Employee deleted successfully!');
        } catch (err) {
            console.error('Error deleting employee:', err);
            alert(err.response?.data?.message || 'Failed to delete employee');
        }
    };

    const openEditDialog = (employee) => {
        setEmployeeToEdit(employee);
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (employee) => {
        setEmployeeToDelete(employee);
        setIsDeleteDialogOpen(true);
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                        <p className="mt-4 text-gray-600">Loading HR data...</p>
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
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={fetchHRData}>Try Again</Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Human Resources</h1>
                        <p className="text-muted-foreground">
                            Manage employees, attendance, leaves, and schedules
                        </p>
                    </div>
                </div>

                {/* HR Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{employees.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Active employees
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {attendance.filter(a => 
                                    new Date(a.date).toDateString() === new Date().toDateString() && 
                                    a.status === 'Present'
                                ).length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Today's attendance
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {leaves.filter(l => l.status === 'Pending').length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Awaiting approval
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for different sections */}
                <Tabs defaultValue="employees" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="employees">Employees</TabsTrigger>
                        <TabsTrigger value="attendance">Attendance</TabsTrigger>
                        <TabsTrigger value="leaves">Leaves</TabsTrigger>
                        <TabsTrigger value="salary">Salary</TabsTrigger>
                    </TabsList>

                    {/* Employees Tab */}
                    <TabsContent value="employees" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Employee Records</h2>
                            <Button onClick={() => setIsEmployeeDialogOpen(true)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Employee
                            </Button>
                        </div>
                        
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.map((employee) => (
                                        <TableRow key={employee.employeeId || employee._userId || employee.personalInfo?.email}>
                                            <TableCell>{employee.employeeId}</TableCell>
                                            <TableCell>
                                                {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                                            </TableCell>
                                            <TableCell>{employee.employment.position}</TableCell>
                                            <TableCell>{employee.employment.department}</TableCell>
                                            <TableCell>
                                                <Badge variant={employee.employment.status === 'Active' ? 'default' : 'secondary'}>
                                                    {employee.employment.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 flex-wrap">
                                                    <Button size="sm" onClick={() => clockIn(employee.employeeId)}>
                                                        Clock In
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => clockOut(employee.employeeId)}>
                                                        Clock Out
                                                    </Button>
                                                    <Button size="sm" variant="secondary" onClick={() => openEditDialog(employee)}>
                                                        Edit
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(employee)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Attendance Tab */}
                    <TabsContent value="attendance" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Attendance Tracking</h2>
                        </div>
                        
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Clock In</TableHead>
                                        <TableHead>Clock Out</TableHead>
                                        <TableHead>Total Hours</TableHead>
                                        <TableHead>OT Hours</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendance.slice(0, 10).map((record) => {
                                        const totalHours = record.totalHours || 0;
                                        // Use the overtime field from database if available, otherwise calculate it
                                        const otHours = record.overtime !== undefined ? record.overtime : (totalHours > 8 ? totalHours - 8 : 0);
                                        
                                        return (
                                            <TableRow key={record._id || record.attendanceId || `${record.employeeId}-${record.date}`}>
                                                <TableCell>{record.employeeId}</TableCell>
                                                <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    {record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={totalHours > 8 ? 'font-medium text-blue-600' : ''}>
                                                        {totalHours ? totalHours.toFixed(1) : '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {otHours > 0 ? (
                                                        <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                                                            {otHours.toFixed(1)}h
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={record.status === 'Present' ? 'default' : 'secondary'}>
                                                        {record.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Leaves Tab */}
                    <TabsContent value="leaves" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Leave Management</h2>
                            <Button onClick={() => setIsLeaveFormOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Request Leave
                            </Button>
                        </div>
                        
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Leave ID</TableHead>
                                        <TableHead>Employee ID</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead>Days</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaves.map((leave) => (
                                        <TableRow key={leave._id || leave.leaveId}>
                                            <TableCell>{leave.leaveId}</TableCell>
                                            <TableCell>{leave.employeeId}</TableCell>
                                            <TableCell>{leave.leaveType}</TableCell>
                                            <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                                            <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                                            <TableCell>{leave.totalDays}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    leave.status === 'Approved' ? 'default' :
                                                    leave.status === 'Rejected' ? 'destructive' : 'secondary'
                                                }>
                                                    {leave.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {leave.status === 'Pending' && (
                                                    <div className="flex gap-1">
                                                        <Button size="sm" onClick={() => approveLeave(leave.leaveId)}>
                                                            <CheckCircle className="h-3 w-3" />
                                                        </Button>
                                                        <Button size="sm" variant="destructive" onClick={() => rejectLeave(leave.leaveId)}>
                                                            <XCircle className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Salary Tab */}
                    <TabsContent value="salary" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Salary Management</h2>
                            <Button onClick={() => setIsSalaryDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Salary Record
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Total Monthly Payroll</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        Rs. {salaries.reduce((sum, salary) => {
                                            const overtimeAmount = (salary.overtimeHours || 0) * (salary.overtimeRate || 0);
                                            return sum + (salary.basicSalary || 0) + (salary.allowances || 0) + overtimeAmount;
                                        }, 0).toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Including overtime payments
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Employees with Salary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {salaries.length}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Average Salary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-purple-600">
                                        Rs. {salaries.length > 0 ? Math.round(salaries.reduce((sum, salary) => {
                                            const overtimeAmount = (salary.overtimeHours || 0) * (salary.overtimeRate || 0);
                                            return sum + (salary.basicSalary || 0) + (salary.allowances || 0) + overtimeAmount;
                                        }, 0) / salaries.length).toLocaleString() : 0}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Including overtime
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Basic Salary</TableHead>
                                        <TableHead>Allowances</TableHead>
                                        <TableHead>OT Hours</TableHead>
                                        <TableHead>OT Amount</TableHead>
                                        <TableHead>Deductions</TableHead>
                                        <TableHead>Net Salary</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {salaries.map((salary) => {
                                        const overtimeAmount = (salary.overtimeHours || 0) * (salary.overtimeRate || 0);
                                        const netSalary = (salary.basicSalary || 0) + (salary.allowances || 0) + overtimeAmount - (salary.deductions || 0);
                                        return (
                                            <TableRow key={salary._id || salary.salaryId}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{salary.employeeInfo?.name || 'Unknown Employee'}</div>
                                                        <div className="text-sm text-gray-500">{salary.employeeId}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{salary.employeeInfo?.position || 'N/A'}</TableCell>
                                                <TableCell>Rs. {(salary.basicSalary || 0).toLocaleString()}</TableCell>
                                                <TableCell>Rs. {(salary.allowances || 0).toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{(salary.overtimeHours || 0).toFixed(1)}h</div>
                                                        {salary.overtimeRate && (
                                                            <div className="text-xs text-gray-500">@Rs.{salary.overtimeRate}/hr</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>Rs. {overtimeAmount.toLocaleString()}</TableCell>
                                                <TableCell>Rs. {(salary.deductions || 0).toLocaleString()}</TableCell>
                                                <TableCell className="font-medium">Rs. {netSalary.toLocaleString()}</TableCell>
                                                <TableCell>{new Date(salary.updatedAt || salary.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedEmployee(salary);
                                                                setIsSalaryDialogOpen(true);
                                                            }}
                                                        >
                                                            Edit
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            {salaries.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No salary records found. Add salary records for employees.
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Add Employee Dialog */}
                <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Add New Employee</DialogTitle>
                            <DialogDescription>
                                Create a new employee record
                            </DialogDescription>
                        </DialogHeader>
                        <EmployeeForm 
                            onClose={() => setIsEmployeeDialogOpen(false)}
                            onEmployeeAdded={fetchHRData}
                        />
                    </DialogContent>
                </Dialog>

                {/* Leave Request Dialog */}
                <Dialog open={isLeaveFormOpen} onOpenChange={setIsLeaveFormOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Request Leave</DialogTitle>
                            <DialogDescription>
                                Submit a new leave request for approval
                            </DialogDescription>
                        </DialogHeader>
                        <LeaveRequestForm 
                            onClose={() => setIsLeaveFormOpen(false)}
                            onLeaveSubmitted={fetchHRData}
                            employees={employees}
                        />
                    </DialogContent>
                </Dialog>

                {/* Edit Employee Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Edit Employee</DialogTitle>
                            <DialogDescription>
                                Update employee information
                            </DialogDescription>
                        </DialogHeader>
                        {employeeToEdit && (
                            <EmployeeForm 
                                onClose={() => {
                                    setIsEditDialogOpen(false);
                                    setEmployeeToEdit(null);
                                }}
                                onEmployeeAdded={fetchHRData}
                                employee={employeeToEdit}
                                isEdit={true}
                            />
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Employee</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this employee? This action cannot be undone.
                                This will also delete all related attendance, leave, and salary records.
                            </DialogDescription>
                        </DialogHeader>
                        {employeeToDelete && (
                            <div className="py-4">
                                <p className="font-medium">
                                    {employeeToDelete.personalInfo.firstName} {employeeToDelete.personalInfo.lastName}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {employeeToDelete.employeeId} - {employeeToDelete.employment.position}
                                </p>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={deleteEmployee}>
                                Delete Employee
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Salary Management Dialog */}
                <Dialog open={isSalaryDialogOpen} onOpenChange={setIsSalaryDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedEmployee ? 'Edit Salary Record' : 'Add Salary Record'}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedEmployee ? 'Update employee salary information' : 'Create a new salary record for an employee'}
                            </DialogDescription>
                        </DialogHeader>
                        <SalaryForm 
                            onClose={() => {
                                setIsSalaryDialogOpen(false);
                                setSelectedEmployee(null);
                            }}
                            onSalarySaved={fetchHRData}
                            employees={employees}
                            existingSalary={selectedEmployee}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}

// Employee Form Component
function EmployeeForm({ onClose, onEmployeeAdded, employee = null, isEdit = false }) {
    const [formData, setFormData] = useState({
        personalInfo: {
            firstName: employee?.personalInfo?.firstName || '',
            lastName: employee?.personalInfo?.lastName || '',
            email: employee?.personalInfo?.email || '',
            phone: employee?.personalInfo?.phone || ''
        },
        employment: {
            position: employee?.employment?.position || '',
            department: employee?.employment?.department || '',
            salary: employee?.employment?.salary || '',
            hireDate: employee?.employment?.hireDate 
                ? new Date(employee.employment.hireDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]
        }
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                employment: {
                    ...formData.employment,
                    salary: parseFloat(formData.employment.salary)
                }
            };

            if (isEdit && employee) {
                await api.put(`/hr/employees/${employee.employeeId}`, payload);
                alert('Employee updated successfully!');
            } else {
                await api.post('/hr/employees', payload);
                alert('Employee added successfully!');
            }
            
            onEmployeeAdded();
            onClose();
        } catch (err) {
            console.error('Error saving employee:', err);
            alert(isEdit ? 'Failed to update employee' : 'Failed to add employee');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">First Name *</label>
                    <Input
                        value={formData.personalInfo.firstName}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, firstName: e.target.value }
                        }))}
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Last Name *</label>
                    <Input
                        value={formData.personalInfo.lastName}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, lastName: e.target.value }
                        }))}
                        required
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                        type="email"
                        value={formData.personalInfo.email}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, email: e.target.value }
                        }))}
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Phone *</label>
                    <Input
                        value={formData.personalInfo.phone}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, phone: e.target.value }
                        }))}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Position *</label>
                    <Input
                        value={formData.employment.position}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            employment: { ...prev.employment, position: e.target.value }
                        }))}
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Department *</label>
                    <Select 
                        value={formData.employment.department} 
                        onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            employment: { ...prev.employment, department: value }
                        }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Production">Production</SelectItem>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="Administration">Administration</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Delivery">Delivery</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Salary *</label>
                    <Input
                        type="number"
                        min="0"
                        value={formData.employment.salary}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            employment: { ...prev.employment, salary: e.target.value }
                        }))}
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Hire Date *</label>
                    <Input
                        type="date"
                        value={formData.employment.hireDate}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            employment: { ...prev.employment, hireDate: e.target.value }
                        }))}
                        required
                    />
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Employee' : 'Add Employee')}
                </Button>
            </DialogFooter>
        </form>
    );
}

// Leave Request Form Component
function LeaveRequestForm({ onClose, onLeaveSubmitted, employees }) {
    const [formData, setFormData] = useState({
        employeeId: '',
        type: '',
        startDate: '',
        endDate: '',
        reason: '',
        days: 0
    });
    const [loading, setLoading] = useState(false);

    const calculateDays = () => {
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            setFormData(prev => ({ ...prev, days: diffDays }));
        }
    };

    useEffect(() => {
        calculateDays();
    }, [formData.startDate, formData.endDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Find the selected employee to get their name
            const selectedEmployee = employees.find(emp => emp.employeeId === formData.employeeId);
            const employeeName = selectedEmployee 
                ? `${selectedEmployee.personalInfo.firstName} ${selectedEmployee.personalInfo.lastName}`
                : '';

            await api.post('/hr/leaves', {
                employeeId: formData.employeeId,
                employeeName: employeeName,
                leaveType: formData.type,
                startDate: formData.startDate,
                endDate: formData.endDate,
                totalDays: parseInt(formData.days),
                reason: formData.reason
            });
            onLeaveSubmitted();
            onClose();
            alert('Leave request submitted successfully!');
        } catch (err) {
            console.error('Error submitting leave request:', err);
            alert('Failed to submit leave request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Employee *</label>
                    <Select 
                        value={formData.employeeId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map((employee) => (
                                <SelectItem key={employee.employeeId} value={employee.employeeId}>
                                    {employee.personalInfo.firstName} {employee.personalInfo.lastName} ({employee.employeeId})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium">Leave Type *</label>
                    <Select 
                        value={formData.type} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Annual">Annual Leave</SelectItem>
                            <SelectItem value="Sick">Sick Leave</SelectItem>
                            <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                            <SelectItem value="Emergency">Emergency Leave</SelectItem>
                            <SelectItem value="Maternity">Maternity Leave</SelectItem>
                            <SelectItem value="Paternity">Paternity Leave</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="text-sm font-medium">Start Date *</label>
                    <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">End Date *</label>
                    <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Total Days</label>
                    <Input
                        type="number"
                        value={formData.days}
                        readOnly
                        className="bg-gray-50"
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium">Reason *</label>
                <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Please provide a reason for your leave request..."
                    required
                />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// Salary Form Component
function SalaryForm({ onClose, onSalarySaved, employees, existingSalary }) {
    const [formData, setFormData] = useState({
        employeeId: existingSalary?.employeeId || '',
        basicSalary: existingSalary?.basicSalary || '',
        allowances: existingSalary?.allowances || '',
        overtimeHours: existingSalary?.overtimeHours || '',
        overtimeRate: existingSalary?.overtimeRate || '',
        deductions: existingSalary?.deductions || '',
        effectiveDate: existingSalary?.effectiveDate ? 
            new Date(existingSalary.effectiveDate).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0],
        notes: existingSalary?.notes || ''
    });
    const [loading, setLoading] = useState(false);
    const [otCalculation, setOtCalculation] = useState(null);
    const [loadingOT, setLoadingOT] = useState(false);

    // Effect to fetch employee's basic salary when employee is selected
    useEffect(() => {
        if (formData.employeeId && !existingSalary) {
            const selectedEmployee = employees.find(emp => emp.employeeId === formData.employeeId);
            if (selectedEmployee) {
                setFormData(prev => ({
                    ...prev,
                    basicSalary: selectedEmployee.employment.salary || 0
                }));
            }
        }
    }, [formData.employeeId, employees, existingSalary]);

    // Function to fetch OT calculation
    const fetchOTCalculation = async () => {
        if (!formData.employeeId) return;
        
        setLoadingOT(true);
        try {
            const response = await api.get(`/hr/employees/${formData.employeeId}/overtime-calculation`);
            setOtCalculation(response.data);
            
            // Auto-populate OT hours
            setFormData(prev => ({
                ...prev,
                overtimeHours: response.data.totalOvertimeHours || 0
            }));
        } catch (err) {
            console.error('Error fetching OT calculation:', err);
            setOtCalculation(null);
        } finally {
            setLoadingOT(false);
        }
    };

    const calculateNetSalary = () => {
        const basic = parseFloat(formData.basicSalary) || 0;
        const allowances = parseFloat(formData.allowances) || 0;
        const overtimeAmount = (parseFloat(formData.overtimeHours) || 0) * (parseFloat(formData.overtimeRate) || 0);
        const deductions = parseFloat(formData.deductions) || 0;
        return basic + allowances + overtimeAmount - deductions;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const overtimeAmount = (parseFloat(formData.overtimeHours) || 0) * (parseFloat(formData.overtimeRate) || 0);
            
            const salaryData = {
                employeeId: formData.employeeId,
                basicSalary: parseFloat(formData.basicSalary) || 0,
                allowances: parseFloat(formData.allowances) || 0,
                overtimeHours: parseFloat(formData.overtimeHours) || 0,
                overtimeRate: parseFloat(formData.overtimeRate) || 0,
                overtimeAmount: overtimeAmount,
                deductions: parseFloat(formData.deductions) || 0,
                effectiveDate: formData.effectiveDate,
                notes: formData.notes,
                netSalary: calculateNetSalary()
            };

            if (existingSalary) {
                // Update existing salary
                await api.put(`/hr/salaries/${existingSalary._id}`, salaryData);
                alert('Salary record updated successfully!');
            } else {
                // Create new salary record
                await api.post('/hr/salaries', salaryData);
                alert('Salary record created successfully!');
            }
            
            onSalarySaved();
            onClose();
        } catch (err) {
            console.error('Error saving salary record:', err);
            alert(err.response?.data?.message || 'Failed to save salary record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Employee *</label>
                    <Select 
                        value={formData.employeeId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                        disabled={!!existingSalary}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map((employee) => (
                                <SelectItem key={employee.employeeId} value={employee.employeeId}>
                                    {employee.personalInfo.firstName} {employee.personalInfo.lastName} ({employee.employeeId})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium">Effective Date *</label>
                    <Input
                        type="date"
                        value={formData.effectiveDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                        required
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="text-sm font-medium">Basic Salary (From Employee Record)</label>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.basicSalary}
                        placeholder="0.00"
                        readOnly
                        className="bg-gray-50 cursor-not-allowed"
                        title="Basic salary is taken from employee record and cannot be changed here"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        This value is from the employee's record and cannot be modified here
                    </p>
                </div>
                <div>
                    <label className="text-sm font-medium">Allowances</label>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.allowances}
                        onChange={(e) => setFormData(prev => ({ ...prev, allowances: e.target.value }))}
                        placeholder="0.00"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Deductions</label>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.deductions}
                        onChange={(e) => setFormData(prev => ({ ...prev, deductions: e.target.value }))}
                        placeholder="0.00"
                    />
                </div>
            </div>

            {/* Overtime Section */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-blue-800">Overtime Calculation</h4>
                    {formData.employeeId && (
                        <Button 
                            type="button" 
                            onClick={fetchOTCalculation} 
                            disabled={loadingOT}
                            size="sm"
                            variant="outline"
                        >
                            {loadingOT ? 'Calculating...' : 'Calculate OT from Attendance'}
                        </Button>
                    )}
                </div>
                
                {otCalculation && (
                    <div className="text-xs text-blue-700 mb-2">
                        Current month: {otCalculation.totalOvertimeHours} hours OT from {otCalculation.workingDays} working days
                    </div>
                )}
                
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium">OT Hours</label>
                        <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={formData.overtimeHours}
                            onChange={(e) => setFormData(prev => ({ ...prev, overtimeHours: e.target.value }))}
                            placeholder="0.0"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">OT Rate (per hour)</label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.overtimeRate}
                            onChange={(e) => setFormData(prev => ({ ...prev, overtimeRate: e.target.value }))}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">OT Amount</label>
                        <div className="text-lg font-semibold text-blue-600 p-2 bg-blue-100 rounded-md">
                            Rs. {((parseFloat(formData.overtimeHours) || 0) * (parseFloat(formData.overtimeRate) || 0)).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Net Salary</label>
                    <div className="text-2xl font-bold text-green-600 p-3 bg-green-50 rounded-md">
                        Rs. {calculateNetSalary().toLocaleString()}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium">Notes</label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes or comments..."
                    />
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (existingSalary ? 'Update Salary' : 'Save Salary')}
                </Button>
            </DialogFooter>
        </form>
    );
}
