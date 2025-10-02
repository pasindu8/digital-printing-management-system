const express = require('express');
const router = express.Router();
const { Employee, Task, Attendance, Leave, Shift, HRReport, Salary } = require('../models/HR');
const { Payroll } = require('../models/Finance');
const User = require('../models/User');

// Employee Management Routes
router.get('/employees', async (req, res) => {
  try {
    const { department, status, email } = req.query;
    
    // Get all users with role 'Employee'
    const employeeUsers = await User.find({ role: 'Employee' }).select('name email');
    
    const employeeRecords = [];
    
    for (const user of employeeUsers) {
      // Check if this user has an existing employee record
      let employeeRecord = await Employee.findOne({ 'personalInfo.email': user.email });
      
      // If no employee record exists, create a basic one from user data
      if (!employeeRecord) {
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        employeeRecord = {
          employeeId: `USR-${user._id}`, // Use user ID as employee ID for users without employee records
          personalInfo: {
            firstName: firstName,
            lastName: lastName,
            email: user.email,
            phone: 'Not provided'
          },
          employment: {
            position: 'Not specified',
            department: 'Not assigned',
            hireDate: user.createdAt || new Date(),
            salary: 0,
            workSchedule: 'Full-time',
            status: 'Active',
            workingHours: {
              startTime: '09:00',
              endTime: '17:00',
              lunchBreak: 60
            }
          },
          permissions: {
            canViewOrders: false,
            canEditOrders: false,
            canViewInventory: false,
            canEditInventory: false,
            canViewFinance: false,
            canEditFinance: false,
            canViewReports: false,
            canManageHR: false,
            isAdmin: false
          },
          performanceMetrics: {
            tasksCompleted: 0,
            averageRating: 0,
            punctualityScore: 100,
            lastReviewDate: null
          },
          workload: {
            assignedOrders: 0,
            completedOrders: 0,
            activeOrders: 0,
            skills: [],
            availability: 'Available'
          },
          _isUserRecord: true // Flag to indicate this is generated from user data
        };
      }
      
      // Apply filters if specified
      if (email && employeeRecord.personalInfo.email !== email) continue;
      if (department && employeeRecord.employment.department !== department) continue;
      if (status && employeeRecord.employment.status !== status) continue;
      
      employeeRecords.push(employeeRecord);
    }
    
    // Sort by hire date (newest first) or creation date for user records
    employeeRecords.sort((a, b) => {
      const dateA = a.employment.hireDate || a.createdAt || new Date();
      const dateB = b.employment.hireDate || b.createdAt || new Date();
      return new Date(dateB) - new Date(dateA);
    });
    
    res.json(employeeRecords);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/employees', async (req, res) => {
  try {
    const data = req.body;
    console.log('HR POST /employees called with data:', data);
    
    // Extract user information from the employee data
    const userData = {
      name: `${data.personalInfo.firstName} ${data.personalInfo.lastName}`,
      email: data.personalInfo.email,
      role: 'Employee', // Always set role to Employee
      emailVerified: true,
      provider: 'hr' // Use HR provider to bypass password requirement
    };
    
    console.log('Creating user with userData:', userData);
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Create user record only (no password required for HR-created employees)
    const user = new User(userData);
    await user.save();
    
    // Return a formatted response that looks like an employee record
    const employeeResponse = {
      employeeId: `USR-${user._id}`,
      personalInfo: {
        firstName: data.personalInfo.firstName,
        lastName: data.personalInfo.lastName,
        email: user.email,
        phone: data.personalInfo.phone || 'Not provided'
      },
      employment: {
        position: data.employment?.position || 'Not specified',
        department: data.employment?.department || 'Not assigned',
        hireDate: user.createdAt,
        salary: data.employment?.salary || 0,
        workSchedule: data.employment?.workSchedule || 'Full-time',
        status: 'Active',
        workingHours: {
          startTime: '09:00',
          endTime: '17:00',
          lunchBreak: 60
        }
      },
      permissions: {
        canViewOrders: false,
        canEditOrders: false,
        canViewInventory: false,
        canEditInventory: false,
        canViewFinance: false,
        canEditFinance: false,
        canViewReports: false,
        canManageHR: false,
        isAdmin: false
      },
      performanceMetrics: {
        tasksCompleted: 0,
        averageRating: 0,
        punctualityScore: 100,
        lastReviewDate: null
      },
      workload: {
        assignedOrders: 0,
        completedOrders: 0,
        activeOrders: 0,
        skills: [],
        availability: 'Available'
      },
      _isUserRecord: true,
      _userId: user._id
    };
    
    res.status(201).json(employeeResponse);
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Get employee profile for individual access
router.get('/employees/:employeeId/profile', async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Return limited profile information
    const profile = {
      employeeId: employee.employeeId,
      personalInfo: employee.personalInfo,
      employment: {
        position: employee.employment.position,
        department: employee.employment.department,
        hireDate: employee.employment.hireDate,
        workSchedule: employee.employment.workSchedule
      },
      performanceMetrics: employee.performanceMetrics
    };
    
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Attendance Management
router.post('/attendance', async (req, res) => {
  try {
    const data = req.body;
    data.attendanceId = 'ATT-' + Date.now();
    
    // Calculate total hours if clock in/out provided
    if (data.clockIn && data.clockOut) {
      const clockInTime = new Date(data.clockIn);
      const clockOutTime = new Date(data.clockOut);
      const diffInMs = clockOutTime - clockInTime;
      const totalHours = (diffInMs / (1000 * 60 * 60)) - (data.breakTime || 0) / 60;
      data.totalHours = Math.max(0, totalHours);
      
      // Check for overtime (assuming 8 hours standard)
      data.overtime = Math.max(0, totalHours - 8);
    }
    
    const attendance = new Attendance(data);
    await attendance.save();
    
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/attendance', async (req, res) => {
  try {
    const { employeeId, date, start_date, end_date } = req.query;
    let filter = {};
    
    if (employeeId) filter.employeeId = employeeId;
    if (date) {
      const targetDate = new Date(date);
      filter.date = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lte: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    } else if (start_date || end_date) {
      filter.date = {};
      if (start_date) filter.date.$gte = new Date(start_date);
      if (end_date) filter.date.$lte = new Date(end_date);
    }
    
    const attendance = await Attendance.find(filter).sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Clock In endpoint
router.post('/attendance/clock-in', async (req, res) => {
  try {
    const { employeeId } = req.body;
    
    // Check if employee exists
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Check if already clocked in today
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    if (existingAttendance && existingAttendance.clockIn) {
      return res.status(400).json({ message: 'Already clocked in today' });
    }
    
    // Create or update attendance record
    const attendanceData = {
      attendanceId: 'ATT-' + Date.now(),
      employeeId,
      date: new Date(),
      clockIn: new Date(),
      status: 'Present'
    };
    
    let attendance;
    if (existingAttendance) {
      attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id,
        { clockIn: new Date(), status: 'Present' },
        { new: true }
      );
    } else {
      attendance = new Attendance(attendanceData);
      await attendance.save();
    }
    
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Clock Out endpoint
router.post('/attendance/clock-out', async (req, res) => {
  try {
    const { employeeId } = req.body;
    
    // Find today's attendance record
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: startOfDay, $lte: endOfDay },
      clockIn: { $exists: true }
    });
    
    if (!attendance) {
      return res.status(400).json({ message: 'No clock-in record found for today' });
    }
    
    if (attendance.clockOut) {
      return res.status(400).json({ message: 'Already clocked out today' });
    }
    
    // Calculate total hours
    const clockOutTime = new Date();
    const clockInTime = new Date(attendance.clockIn);
    const diffInMs = clockOutTime - clockInTime;
    const totalHours = Math.round((diffInMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
    
    // Update attendance record
    attendance.clockOut = clockOutTime;
    attendance.totalHours = totalHours;
    attendance.overtime = Math.max(0, totalHours - 8); // Assuming 8 hours is standard
    await attendance.save();
    
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Leave Management
router.post('/leave/apply', async (req, res) => {
  try {
    const data = req.body;
    data.leaveId = 'LEV-' + Date.now();
    
    // Calculate total days
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const diffTime = Math.abs(endDate - startDate);
    data.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const leave = new Leave(data);
    await leave.save();
    
    res.status(201).json({ leave, message: 'Leave application submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/leave', async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    let filter = {};
    
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;
    
    const leaves = await Leave.find(filter).sort({ appliedDate: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/leave/:id/review', async (req, res) => {
  try {
    const { status, reviewComments, reviewerId } = req.body;
    
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewComments,
        reviewedBy: reviewerId,
        reviewedDate: new Date()
      },
      { new: true }
    );
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave application not found' });
    }
    
    res.json({ leave, message: `Leave application ${status.toLowerCase()}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Performance and Task Management
router.post('/tasks', async (req, res) => {
  try {
    const data = req.body;
    data.taskId = 'TSK-' + Date.now();
    
    const task = new Task(data);
    await task.save();
    
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/tasks', async (req, res) => {
  try {
    const { assignedTo, status } = req.query;
    let filter = {};
    
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/tasks/:id/complete', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Completed',
        completedDate: new Date(),
        actualHours: req.body.actualHours
      },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Update employee performance metrics
    const employee = await Employee.findOne({ employeeId: task.assignedTo });
    if (employee) {
      employee.performanceMetrics.tasksCompleted += 1;
      await employee.save();
    }
    
    res.json({ task, message: 'Task marked as completed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Payslip access for employees
router.get('/employees/:employeeId/payslips', async (req, res) => {
  try {
    const payslips = await Payroll.find({ 
      employeeId: req.params.employeeId,
      status: { $in: ['Approved', 'Paid'] }
    }).sort({ 'period.startDate': -1 });
    
    res.json(payslips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Schedule Management
router.post('/schedules', async (req, res) => {
  try {
    const data = req.body;
    data.shiftId = 'SFT-' + Date.now();
    
    const shift = new Shift(data);
    await shift.save();
    
    res.status(201).json(shift);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/schedules/calendar', async (req, res) => {
  try {
    const { start_date, end_date, department } = req.query;
    let filter = {};
    
    if (start_date || end_date) {
      filter.date = {};
      if (start_date) filter.date.$gte = new Date(start_date);
      if (end_date) filter.date.$lte = new Date(end_date);
    }
    if (department) filter.department = department;
    
    const shifts = await Shift.find(filter).sort({ date: 1 });
    
    // Group by date for calendar view
    const calendarData = shifts.reduce((acc, shift) => {
      const date = shift.date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(shift);
      return acc;
    }, {});
    
    res.json(calendarData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// HR Reports
router.post('/reports/generate', async (req, res) => {
  try {
    const { reportType, startDate, endDate, department } = req.body;
    let reportData = {};
    
    switch (reportType) {
      case 'attendance_summary':
        let filter = {
          date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };
        
        const attendanceSummary = await Attendance.aggregate([
          { $match: filter },
          {
            $group: {
              _id: '$employeeId',
              employeeName: { $first: '$employeeName' },
              totalDays: { $sum: 1 },
              presentDays: {
                $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
              },
              lateDays: {
                $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] }
              },
              totalHours: { $sum: '$totalHours' },
              overtimeHours: { $sum: '$overtime' }
            }
          }
        ]);
        
        reportData = attendanceSummary;
        break;
        
      case 'salary_report':
        const salaryData = await Payroll.find({
          'period.startDate': { $gte: new Date(startDate) },
          'period.endDate': { $lte: new Date(endDate) }
        });
        reportData = salaryData;
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }
    
    const report = new HRReport({
      reportId: 'HRRPT-' + Date.now(),
      reportType,
      period: { startDate: new Date(startDate), endDate: new Date(endDate) },
      data: reportData
    });
    
    await report.save();
    res.status(201).json({ report, message: 'HR report generated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedAt: new Date() }, 
      { new: true }
    );
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/employees/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Task Management Routes
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const data = req.body;
    data.taskId = 'TASK-' + Date.now();
    
    const task = new Task(data);
    await task.save();
    
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: new Date() };
    
    if (data.status === 'Completed' && !data.completedDate) {
      data.completedDate = new Date();
    }
    
    const task = await Task.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Attendance Routes
router.get('/attendance', async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    
    let query = {};
    if (employeeId) query.employeeId = employeeId;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const attendance = await Attendance.find(query).sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/attendance/clock-in', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if already clocked in today
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: today
    });
    
    if (existingAttendance && existingAttendance.clockIn) {
      return res.status(400).json({ message: 'Already clocked in today' });
    }
    
    const attendance = existingAttendance || new Attendance({
      employeeId,
      date: today
    });
    
    attendance.clockIn = new Date();
    attendance.status = 'Present';
    
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/attendance/clock-out', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      employeeId,
      date: today
    });
    
    if (!attendance || !attendance.clockIn) {
      return res.status(400).json({ message: 'Must clock in first' });
    }
    
    if (attendance.clockOut) {
      return res.status(400).json({ message: 'Already clocked out today' });
    }
    
    attendance.clockOut = new Date();
    
    // Calculate total hours
    const workTime = attendance.clockOut - attendance.clockIn;
    attendance.totalHours = ((workTime / (1000 * 60 * 60)) - (attendance.breakTime / 60)).toFixed(2);
    
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Leave Management Routes
router.get('/leaves', async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    
    let query = {};
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;
    
    const leaves = await Leave.find(query).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/leaves', async (req, res) => {
  try {
    const data = req.body;
    data.leaveId = 'LEAVE-' + Date.now();
    
    // Calculate days if not provided
    if (!data.totalDays && data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      data.totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    }
    
    const leave = new Leave(data);
    await leave.save();
    
    res.status(201).json(leave);
  } catch (err) {
    console.error('Leave creation error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.put('/leaves/:id/approve', async (req, res) => {
  try {
    const { approvedBy, comments } = req.body;
    
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Approved',
        approvedBy,
        approvedDate: new Date(),
        comments
      },
      { new: true }
    );
    
    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// General leave update route
router.patch('/leaves/:id', async (req, res) => {
  try {
    const { status, approvedBy, comments } = req.body;
    
    const updateData = {
      status,
      ...(approvedBy && { approvedBy }),
      ...(status !== 'Pending' && { approvedDate: new Date() }),
      ...(comments && { comments })
    };
    
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }
    
    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/leaves/:id/reject', async (req, res) => {
  try {
    const { approvedBy, comments } = req.body;
    
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Rejected',
        approvedBy,
        approvedDate: new Date(),
        comments
      },
      { new: true }
    );
    
    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Shift Management Routes
router.get('/shifts', async (req, res) => {
  try {
    const { date, department } = req.query;
    
    let query = {};
    if (date) query.date = new Date(date);
    if (department) query.department = department;
    
    const shifts = await Shift.find(query).sort({ date: -1, startTime: 1 });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/shifts', async (req, res) => {
  try {
    const data = req.body;
    data.shiftId = 'SHIFT-' + Date.now();
    
    const shift = new Shift(data);
    await shift.save();
    
    res.status(201).json(shift);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/shifts/:id', async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(shift);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/shifts/:id', async (req, res) => {
  try {
    await Shift.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shift deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Workload Management Routes
router.get('/employees/available', async (req, res) => {
  try {
    console.log('Available employees endpoint called');
    const { department, skills } = req.query;
    
    let filter = { 
      'employment.status': 'Active'
    };
    
    // Only add workload filter if workload exists
    if (await Employee.findOne({ workload: { $exists: true } })) {
      filter['workload.availability'] = { $in: ['Available', 'Busy'] };
    }
    
    if (department) filter['employment.department'] = department;
    if (skills) {
      const skillsArray = skills.split(',');
      if (await Employee.findOne({ 'workload.skills': { $exists: true } })) {
        filter['workload.skills'] = { $in: skillsArray };
      }
    }
    
    console.log('Filter:', JSON.stringify(filter));
    
    const employees = await Employee.find(filter)
      .sort({ 'workload.activeOrders': 1 }) // Sort by workload, least busy first
      .select('employeeId personalInfo employment workload');
    
    // Filter employees to only include those whose corresponding user has role 'Employee'
    const filteredEmployees = [];
    for (const employee of employees) {
      const user = await User.findOne({ email: employee.personalInfo.email });
      if (user && user.role === 'Employee') {
        filteredEmployees.push(employee);
      }
    }
    
    console.log('Found employees:', employees.length, 'Filtered employees:', filteredEmployees.length);
    res.json(filteredEmployees);
  } catch (err) {
    console.error('Available employees error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/employees/:employeeId/workload/update', async (req, res) => {
  try {
    const { action, orderId } = req.body; // action: 'assign' | 'complete' | 'unassign'
    
    const employee = await Employee.findOne({ employeeId: req.params.employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    switch (action) {
      case 'assign':
        employee.workload.assignedOrders += 1;
        employee.workload.activeOrders += 1;
        break;
      case 'complete':
        employee.workload.completedOrders += 1;
        employee.workload.activeOrders = Math.max(0, employee.workload.activeOrders - 1);
        break;
      case 'unassign':
        employee.workload.assignedOrders = Math.max(0, employee.workload.assignedOrders - 1);
        employee.workload.activeOrders = Math.max(0, employee.workload.activeOrders - 1);
        break;
    }

    // Update availability based on workload
    if (employee.workload.activeOrders === 0) {
      employee.workload.availability = 'Available';
    } else if (employee.workload.activeOrders <= 3) {
      employee.workload.availability = 'Busy';
    } else {
      employee.workload.availability = 'Overloaded';
    }

    employee.updatedAt = new Date();
    await employee.save();

    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/workload/dashboard', async (req, res) => {
  try {
    const employees = await Employee.find({ 'employment.status': 'Active' })
      .select('employeeId personalInfo employment workload');

    // Filter employees to only include those whose corresponding user has role 'Employee'
    const filteredEmployees = [];
    for (const employee of employees) {
      const user = await User.findOne({ email: employee.personalInfo.email });
      if (user && user.role === 'Employee') {
        filteredEmployees.push(employee);
      }
    }

    const dashboard = {
      totalEmployees: filteredEmployees.length,
      availableEmployees: filteredEmployees.filter(e => e.workload.availability === 'Available').length,
      busyEmployees: filteredEmployees.filter(e => e.workload.availability === 'Busy').length,
      overloadedEmployees: filteredEmployees.filter(e => e.workload.availability === 'Overloaded').length,
      departmentWorkload: {},
      employees: filteredEmployees
    };

    // Calculate department workload
    filteredEmployees.forEach(emp => {
      const dept = emp.employment.department;
      if (!dashboard.departmentWorkload[dept]) {
        dashboard.departmentWorkload[dept] = {
          totalEmployees: 0,
          totalActiveOrders: 0,
          averageWorkload: 0
        };
      }
      dashboard.departmentWorkload[dept].totalEmployees += 1;
      dashboard.departmentWorkload[dept].totalActiveOrders += emp.workload.activeOrders;
    });

    // Calculate averages
    Object.keys(dashboard.departmentWorkload).forEach(dept => {
      const deptData = dashboard.departmentWorkload[dept];
      deptData.averageWorkload = deptData.totalActiveOrders / deptData.totalEmployees;
    });

    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Salary Management Routes
router.get('/salaries', async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    let filter = { status: 'Active' }; // Default to active salaries
    
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;
    
    const salaries = await Salary.find(filter).sort({ effectiveDate: -1 });
    res.json(salaries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/salaries', async (req, res) => {
  try {
    const data = req.body;
    
    // Generate unique salary ID
    data.salaryId = 'SAL-' + Date.now();
    
    // Calculate overtime amount
    data.overtimeAmount = (data.overtimeHours || 0) * (data.overtimeRate || 0);
    
    // Ensure netSalary is calculated correctly
    data.netSalary = (data.basicSalary || 0) + (data.allowances || 0) + (data.overtimeAmount || 0) - (data.deductions || 0);
    
    // Check if employee exists
    const employee = await Employee.findOne({ employeeId: data.employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Check if there's already an active salary record for this employee
    const existingSalary = await Salary.findOne({ 
      employeeId: data.employeeId, 
      status: 'Active' 
    });
    
    if (existingSalary) {
      // Archive the existing salary record
      existingSalary.status = 'Archived';
      existingSalary.updatedAt = new Date();
      await existingSalary.save();
    }
    
    const salary = new Salary(data);
    await salary.save();
    
    res.status(201).json(salary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/salaries/:id', async (req, res) => {
  try {
    const data = req.body;
    
    // Calculate overtime amount
    data.overtimeAmount = (data.overtimeHours || 0) * (data.overtimeRate || 0);
    
    // Ensure netSalary is calculated correctly
    data.netSalary = (data.basicSalary || 0) + (data.allowances || 0) + (data.overtimeAmount || 0) - (data.deductions || 0);
    data.updatedAt = new Date();
    
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    res.json(salary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/salaries/:id', async (req, res) => {
  try {
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      { status: 'Archived', updatedAt: new Date() },
      { new: true }
    );
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    res.json({ message: 'Salary record archived successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get salary history for an employee
router.get('/employees/:employeeId/salary-history', async (req, res) => {
  try {
    const salaries = await Salary.find({ 
      employeeId: req.params.employeeId 
    }).sort({ effectiveDate: -1 });
    
    res.json(salaries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Calculate overtime hours for an employee for current month
router.get('/employees/:employeeId/overtime-calculation', async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetDate = new Date();
    
    if (month && year) {
      targetDate.setFullYear(parseInt(year), parseInt(month) - 1, 1);
    } else {
      targetDate.setDate(1); // First day of current month
    }
    
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);
    
    // Get attendance records for the month
    const attendanceRecords = await Attendance.find({
      employeeId: req.params.employeeId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'Present'
    });
    
    // Calculate total overtime hours
    let totalOvertimeHours = 0;
    const overtimeDetails = [];
    
    attendanceRecords.forEach(record => {
      if (record.totalHours > 8) {
        const dailyOT = record.totalHours - 8;
        totalOvertimeHours += dailyOT;
        overtimeDetails.push({
          date: record.date,
          totalHours: record.totalHours,
          overtimeHours: dailyOT
        });
      }
    });
    
    res.json({
      employeeId: req.params.employeeId,
      month: targetDate.getMonth() + 1,
      year: targetDate.getFullYear(),
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      workingDays: attendanceRecords.length,
      overtimeDetails
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
