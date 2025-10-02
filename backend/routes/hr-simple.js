const express = require('express');
const router = express.Router();
const { Employee, Attendance, Leave, Salary } = require('../models/HR');
const User = require('../models/User');
const Employee_Details = require('../models/Employee_Details');
const { Expense, LedgerEntry } = require('../models/Finance');
const { generatePassword, sendEmployeeWelcomeEmail } = require('../utils/employeeUtils');

console.log('=== HR-SIMPLE.JS LOADED ===');

// Add middleware to log all requests to hr routes
router.use((req, res, next) => {
  console.log(`HR-SIMPLE: ${req.method} ${req.path}`);
  next();
});

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'HR routes working', timestamp: new Date() });
});

// Unique test endpoint to verify this file is being used
router.get('/simple-test', (req, res) => {
  res.json({ message: 'This is from hr-simple.js', timestamp: new Date() });
});

// Test endpoint to verify database updates work
router.post('/employees/:employeeId/test-update', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Make a simple update to test database operations
    employee.updatedAt = new Date();
    await employee.save();
    
    res.json({ 
      message: 'Test update successful', 
      employeeId,
      updatedAt: employee.updatedAt 
    });
  } catch (err) {
    res.status(500).json({ message: 'Test update failed', error: err.message });
  }
});

// Simple employees route - now using Employee_Details table
router.get('/employees', async (req, res) => {
  try {
    const { status } = req.query;
    console.log('Getting all employees with Employee_Details...');
    
    // Get all Employee_Details records with populated user data
    const employeeDetails = await Employee_Details.find({})
      .populate('user', 'firstName lastName name email phone')
      .lean();
    
    const employeeRecords = [];
    
    for (const empDetail of employeeDetails) {
      if (empDetail.user) {
        const employeeRecord = {
          employeeId: empDetail.employeeId,
          personalInfo: {
            firstName: empDetail.user.firstName || empDetail.user.name.split(' ')[0] || '',
            lastName: empDetail.user.lastName || empDetail.user.name.split(' ').slice(1).join(' ') || '',
            email: empDetail.user.email,
            phone: empDetail.user.phone || 'Not provided'
          },
          employment: {
            position: empDetail.employment.position,
            department: empDetail.employment.department,
            hireDate: empDetail.employment.hireDate,
            salary: empDetail.employment.salary,
            workSchedule: empDetail.employment.workSchedule,
            status: empDetail.employment.status,
            workingHours: empDetail.employment.workingHours
          },
          workload: empDetail.workload,
          performanceMetrics: empDetail.performanceMetrics,
          _isEmployeeDetails: true,
          _userId: empDetail.userId,
          _employeeDetailsId: empDetail._id
        };
        
        // Apply status filter if specified
        if (status && employeeRecord.employment.status !== status) continue;
        
        employeeRecords.push(employeeRecord);
      }
    }
    
    // Also get users with Employee role who don't have Employee_Details (legacy support)
    const employeeUsers = await User.find({ 
      role: 'Employee',
      _id: { $nin: employeeDetails.map(ed => ed.userId) }
    }).select('firstName lastName name email phone createdAt');
    
    for (const user of employeeUsers) {
      const nameParts = user.name.split(' ');
      const firstName = user.firstName || nameParts[0] || '';
      const lastName = user.lastName || nameParts.slice(1).join(' ') || '';
      
      const employeeRecord = {
        employeeId: `USR-${user._id}`,
        personalInfo: {
          firstName: firstName,
          lastName: lastName,
          email: user.email,
          phone: user.phone || 'Not provided'
        },
        employment: {
          position: 'Not specified',
          department: 'Not assigned',
          hireDate: user.createdAt,
          salary: 0,
          workSchedule: 'Full-time',
          status: 'Active',
          workingHours: {
            startTime: '09:00',
            endTime: '17:00',
            lunchBreak: 60
          }
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
      
      // Apply status filter if specified
      if (status && employeeRecord.employment.status !== status) continue;
      
      employeeRecords.push(employeeRecord);
    }
    
    console.log('Found Employee_Details records:', employeeDetails.length, 'Legacy user records:', employeeUsers.length);
    res.json(employeeRecords.slice(0, 50)); // Limit to 50 for performance
  } catch (err) {
    console.error('Error getting employees:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add new employee - creates User and Employee_Details records with password generation and email
router.post('/employees', async (req, res) => {
  try {
    console.log('Adding new employee with Employee_Details:', req.body);
    const data = req.body;
    
    // Validate required fields
    if (!data.personalInfo?.firstName || !data.personalInfo?.lastName || !data.personalInfo?.email) {
      return res.status(400).json({ message: 'First name, last name, and email are required' });
    }
    
    if (!data.employment?.position || !data.employment?.department || !data.employment?.salary) {
      return res.status(400).json({ message: 'Position, department, and salary are required' });
    }
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: data.personalInfo.email });
    if (existingUser) {
      console.log('User already exists:', data.personalInfo.email);
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Generate password for the new employee
    const generatedPassword = generatePassword();
    
    // Create user record with all required fields
    const userData = {
      name: `${data.personalInfo.firstName} ${data.personalInfo.lastName}`,
      firstName: data.personalInfo.firstName,
      lastName: data.personalInfo.lastName,
      email: data.personalInfo.email,
      phone: data.personalInfo.phone || '',
      password: generatedPassword,
      role: 'Employee',
      emailVerified: true,
      provider: 'hr' // Set provider to 'hr' so password validation logic works correctly
    };
    
    const user = new User(userData);
    await user.save();
    
    console.log('Created new user:', user._id, user.email);
    
    // Generate unique employee ID
    const employeeId = `EMP-${Date.now()}-${user._id.toString().slice(-6)}`;
    
    // Create Employee_Details record
    const employeeDetailsData = {
      employeeId: employeeId,
      userId: user._id,
      employment: {
        department: data.employment.department,
        position: data.employment.position,
        salary: parseFloat(data.employment.salary),
        hireDate: data.employment.hireDate ? new Date(data.employment.hireDate) : new Date(),
        workSchedule: data.employment.workSchedule || 'Full-time',
        status: 'Active',
        workingHours: {
          startTime: data.employment.workingHours?.startTime || '09:00',
          endTime: data.employment.workingHours?.endTime || '17:00',
          lunchBreak: data.employment.workingHours?.lunchBreak || 60
        }
      },
      workload: {
        assignedOrders: 0,
        completedOrders: 0,
        activeOrders: 0,
        skills: data.workload?.skills || [],
        availability: 'Available'
      },
      performanceMetrics: {
        tasksCompleted: 0,
        averageRating: 0,
        punctualityScore: 100,
        lastReviewDate: null
      }
    };
    
    const employeeDetails = new Employee_Details(employeeDetailsData);
    await employeeDetails.save();
    
    console.log('Created new Employee_Details:', employeeDetails.employeeId);
    
    // Prepare email data
    const emailData = {
      firstName: data.personalInfo.firstName,
      lastName: data.personalInfo.lastName,
      email: data.personalInfo.email,
      employeeId: employeeId,
      position: data.employment.position,
      department: data.employment.department,
      hireDate: employeeDetailsData.employment.hireDate
    };
    
    // Send welcome email with credentials (don't wait for it to complete)
    console.log(`Attempting to send welcome email to: ${data.personalInfo.email}`);
    sendEmployeeWelcomeEmail(emailData, generatedPassword)
      .then(result => {
        if (result.success) {
          console.log(`✅ Welcome email sent successfully to: ${data.personalInfo.email}`);
          console.log(`📧 Email message ID: ${result.messageId}`);
        } else {
          console.error(`❌ Failed to send welcome email to ${data.personalInfo.email}:`, result.error);
        }
      })
      .catch(error => {
        console.error(`💥 Error sending welcome email to ${data.personalInfo.email}:`, error.message);
      });
    
    // Return formatted employee response
    const employeeResponse = {
      employeeId: employeeDetails.employeeId,
      personalInfo: {
        firstName: data.personalInfo.firstName,
        lastName: data.personalInfo.lastName,
        email: user.email,
        phone: user.phone || 'Not provided'
      },
      employment: {
        position: employeeDetails.employment.position,
        department: employeeDetails.employment.department,
        hireDate: employeeDetails.employment.hireDate,
        salary: employeeDetails.employment.salary,
        workSchedule: employeeDetails.employment.workSchedule,
        status: employeeDetails.employment.status,
        workingHours: employeeDetails.employment.workingHours
      },
      workload: employeeDetails.workload,
      performanceMetrics: employeeDetails.performanceMetrics,
      _isEmployeeDetails: true,
      _userId: user._id,
      _employeeDetailsId: employeeDetails._id
    };
    
    console.log('Returning employee response for:', employeeResponse.employeeId);
    res.status(201).json({ 
      message: 'Employee added successfully. Welcome email sent with login credentials.',
      employee: employeeResponse 
    });
  } catch (err) {
    console.error('Error adding employee:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Employee with this email or ID already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Simple available employees route
router.get('/employees/available', async (req, res) => {
  try {
  const { department } = req.query;
  console.log('Getting available employees for users with role "Employee"...');
  
  // Get all users with role 'Employee'
  const employeeUsers = await User.find({ role: 'Employee' }).select('name email createdAt');
  
  const availableEmployees = [];
  
  for (const user of employeeUsers) {
    // Check if this user has an existing employee record
    let employeeRecord = await Employee.findOne({ 'personalInfo.email': user.email });
    
    // If no employee record exists, create a basic one from user data
    if (!employeeRecord) {
      const nameParts = user.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      employeeRecord = {
        employeeId: `USR-${user._id}`,
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
          status: 'Active'
        },
        workload: {
          assignedOrders: 0,
          completedOrders: 0,
          activeOrders: 0,
          availability: 'Available'
        },
        _isUserRecord: true
      };
    }
    
    // Only include active employees and apply department filter
    if (employeeRecord.employment.status === 'Active') {
      if (!department || 
          employeeRecord.employment.department === department ||
          employeeRecord.employment.department === 'Not assigned') {
        availableEmployees.push(employeeRecord);
      }
    }
  }
  
  console.log('Found available employee users:', employeeUsers.length, 'Available employees:', availableEmployees.length);
  res.json(availableEmployees.slice(0, 10));
  } catch (err) {
    console.error('Error getting available employees:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get employee profile for individual access
router.get('/employees/:employeeId/profile', async (req, res) => {
  try {
    console.log('Getting employee profile for:', req.params.employeeId);
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
        status: employee.employment.status
      },
      workload: employee.workload || { assigned: 0, active: 0, completed: 0 }
    };
    
    console.log('Found employee profile:', profile.personalInfo?.firstName);
    res.json(profile);
  } catch (err) {
    console.error('Error getting employee profile:', err);
    res.status(500).json({ message: err.message });
  }
});

// Workload dashboard summary
router.get('/workload/dashboard', async (req, res) => {
  try {
    // Get all users with role 'Employee'
    const employeeUsers = await User.find({ role: 'Employee' }).select('name email createdAt');
    
    const allEmployeeRecords = [];
    
    for (const user of employeeUsers) {
      // Check if this user has an existing employee record
      let employeeRecord = await Employee.findOne({ 'personalInfo.email': user.email });
      
      // If no employee record exists, create a basic one from user data
      if (!employeeRecord) {
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        employeeRecord = {
          employeeId: `USR-${user._id}`,
          personalInfo: {
            firstName: firstName,
            lastName: lastName,
            email: user.email
          },
          employment: {
            department: 'Not assigned',
            status: 'Active'
          },
          workload: {
            assignedOrders: 0,
            completedOrders: 0,
            activeOrders: 0,
            availability: 'Available'
          },
          _isUserRecord: true
        };
      }
      
      // Only include active employees
      if (employeeRecord.employment.status === 'Active') {
        allEmployeeRecords.push(employeeRecord);
      }
    }

    const summary = {
      activeEmployees: allEmployeeRecords.length,
      totalAssigned: 0,
      totalActive: 0,
      totalCompleted: 0,
      departmentWorkload: {}
    };

    // Aggregate totals and department breakdown
    for (const emp of allEmployeeRecords) {
      const wl = emp.workload || {};
      const dept = emp.employment?.department || 'Unknown';
      const assigned = Number(wl.assignedOrders || 0);
      const active = Number(wl.activeOrders || 0);
      const completed = Number(wl.completedOrders || 0);

      summary.totalAssigned += assigned;
      summary.totalActive += active;
      summary.totalCompleted += completed;

      if (!summary.departmentWorkload[dept]) {
        summary.departmentWorkload[dept] = {
          employees: 0,
          assigned: 0,
          active: 0,
          completed: 0,
          averageWorkload: 0
        };
      }
      const d = summary.departmentWorkload[dept];
      d.employees += 1;
      d.assigned += assigned;
      d.active += active;
      d.completed += completed;
    }

    // Compute averages per department
    for (const dept of Object.keys(summary.departmentWorkload)) {
      const d = summary.departmentWorkload[dept];
      d.averageWorkload = d.employees ? d.active / d.employees : 0;
    }

    return res.json(summary);
  } catch (err) {
    console.error('Error building workload dashboard:', err);
    res.status(500).json({ message: err.message });
  }
});

// Attendance minimal endpoints
router.get('/attendance', async (req, res) => {
  try {
    const records = await Attendance.find({}).sort({ date: -1 }).limit(100).lean();
    res.json(records);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/attendance/clock-in', async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required' });
    const employee = await Employee.findOne({ employeeId }).select('employeeId personalInfo').lean();
    const record = new Attendance({
      attendanceId: 'ATT-' + Date.now(),
      employeeId,
      employeeName: employee ? `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim() : 'Unknown',
      date: new Date(),
      clockIn: new Date(),
      status: 'Present'
    });
    await record.save();
    res.json({ message: 'Clock-in recorded', record });
  } catch (err) {
    console.error('Error clocking in:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/attendance/clock-out', async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required' });
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const record = await Attendance.findOne({ employeeId, date: { $gte: start, $lt: end } });
    if (!record) return res.status(404).json({ message: 'No attendance record for today' });
    record.clockOut = new Date();
    const ms = (record.clockOut - (record.clockIn || start));
    record.totalHours = Math.max(0, Math.round(ms / (1000 * 60 * 60) * 100) / 100);
    await record.save();
    res.json({ message: 'Clock-out recorded', record });
  } catch (err) {
    console.error('Error clocking out:', err);
    res.status(500).json({ message: err.message });
  }
});

// Leaves minimal endpoints
router.get('/leaves', async (req, res) => {
  try {
    const items = await Leave.find({}).sort({ createdAt: -1 }).limit(100).lean();
    res.json(items);
  } catch (err) {
    console.error('Error fetching leaves:', err);
    res.status(500).json({ message: err.message });
  }
});

// Test route to check if routes are working
router.get('/leaves/test', (req, res) => {
  res.json({ message: 'Test route working', timestamp: new Date() });
});

// Simple POST test route
router.post('/leaves/test-post', (req, res) => {
  res.json({ message: 'POST test route working', body: req.body });
});

router.post('/leaves', async (req, res) => {
  console.log('=== POST /leaves endpoint hit ===');
  try {
    const { employeeId, employeeName, leaveType, startDate, endDate, totalDays, reason } = req.body;
    console.log('Request body:', req.body);
    
    // Validate required fields with detailed error messages
    if (!employeeId) {
      console.log('❌ Missing employeeId');
      return res.status(400).json({ message: 'Employee ID is required' });
    }
    if (!leaveType) {
      console.log('❌ Missing leaveType');
      return res.status(400).json({ message: 'Leave type is required' });
    }
    if (!startDate) {
      console.log('❌ Missing startDate');
      return res.status(400).json({ message: 'Start date is required' });
    }
    if (!endDate) {
      console.log('❌ Missing endDate');
      return res.status(400).json({ message: 'End date is required' });
    }
    
    console.log(`🔍 Looking for employee with ID: ${employeeId}`);
    
    // Check if employee exists (use new Employee_Details system or legacy User system)
    let employeeExists = false;
    let finalEmployeeName = employeeName;
    
    // First check Employee_Details (new system)
    console.log('🔍 Checking Employee_Details...');
    const employeeDetails = await Employee_Details.findOne({ employeeId }).populate('userId');
    if (employeeDetails && employeeDetails.userId) {
      console.log('✅ Found in Employee_Details:', employeeDetails.userId.firstName, employeeDetails.userId.lastName);
      employeeExists = true;
      finalEmployeeName = employeeName || `${employeeDetails.userId.firstName} ${employeeDetails.userId.lastName}`;
    } else {
      console.log('❌ Not found in Employee_Details');
      // Check legacy Employee model
      console.log('🔍 Checking legacy Employee model...');
      const employee = await Employee.findOne({ employeeId });
      if (employee) {
        console.log('✅ Found in Employee model:', employee.personalInfo.firstName, employee.personalInfo.lastName);
        employeeExists = true;
        finalEmployeeName = employeeName || `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`;
      } else {
        console.log('❌ Not found in Employee model');
        // Check if it's a user-generated employee (USR- prefix)
        if (employeeId.startsWith('USR-')) {
          console.log('🔍 Checking User model for USR- format...');
          const userId = employeeId.replace('USR-', '');
          const user = await User.findById(userId);
          if (user && user.role === 'Employee') {
            console.log('✅ Found in User model:', user.name);
            employeeExists = true;
            finalEmployeeName = employeeName || user.name;
          } else {
            console.log('❌ User not found or not an employee');
          }
        } else {
          console.log('❌ Not USR- format, giving up');
        }
      }
    }
    
    console.log(`🔍 Final result: employeeExists = ${employeeExists}`);
    if (!employeeExists) {
      console.log(`❌ Employee not found for ID: ${employeeId}`);
      return res.status(404).json({ message: `Employee not found with ID: ${employeeId}` });
    }
    
    // Generate leave ID
    const leaveId = `LEAVE-${Date.now()}`;
    
    // Create new leave request
    const leave = new Leave({
      leaveId,
      employeeId,
      employeeName: finalEmployeeName,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDays: totalDays || 1,
      reason: reason || '',
      status: 'Pending',
      appliedDate: new Date()
    });
    
    await leave.save();
    res.status(201).json({ message: 'Leave request submitted successfully', leave });
  } catch (err) {
    console.error('Error creating leave request:', err);
    res.status(500).json({ message: err.message });
  }
});

router.patch('/leaves/:leaveId', async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status } = req.body;
    const allowed = ['Pending', 'Approved', 'Rejected', 'Cancelled'];
    if (status && !allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const leave = await Leave.findOneAndUpdate({ leaveId }, { ...(status ? { status } : {}) }, { new: true });
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    res.json({ message: 'Leave updated', leave });
  } catch (err) {
    console.error('Error updating leave:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete employee endpoint - deletes both User and Employee_Details records
router.delete('/employees/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log('Deleting employee:', employeeId);
    
    // Check if it's a new Employee_Details record (EMP- prefix)
    if (employeeId.startsWith('EMP-')) {
      // Find Employee_Details record first
      const employeeDetails = await Employee_Details.findOne({ employeeId });
      
      if (!employeeDetails) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Delete the User record
      await User.findByIdAndDelete(employeeDetails.userId);
      
      // Delete the Employee_Details record
      await Employee_Details.findOneAndDelete({ employeeId });
      
      // Delete related records
      await Attendance.deleteMany({ employeeId });
      await Leave.deleteMany({ employeeId });
      await Salary.deleteMany({ employeeId });
      
      return res.json({ message: 'Employee deleted successfully' });
    }
    // Legacy support for USR- prefixed employees
    else if (employeeId.startsWith('USR-')) {
      const userId = employeeId.replace('USR-', '');
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Delete the user record
      await User.findByIdAndDelete(userId);
      
      // Delete any related records
      await Attendance.deleteMany({ employeeId });
      await Leave.deleteMany({ employeeId });
      await Salary.deleteMany({ employeeId });
      
      return res.json({ message: 'Employee deleted successfully' });
    } else {
      // Handle legacy Employee records
      const employee = await Employee.findOneAndDelete({ employeeId });
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Delete related records
      await Attendance.deleteMany({ employeeId });
      await Leave.deleteMany({ employeeId });
      await Salary.deleteMany({ employeeId });
      
      return res.json({ message: 'Employee deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update employee endpoint - updates both User and Employee_Details records
router.put('/employees/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const updateData = req.body;
    console.log('Updating employee:', employeeId, updateData);
    
    // Check if it's a new Employee_Details record (EMP- prefix)
    if (employeeId.startsWith('EMP-')) {
      // Find Employee_Details record
      const employeeDetails = await Employee_Details.findOne({ employeeId });
      if (!employeeDetails) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Update User record
      const updateUserData = {
        name: `${updateData.personalInfo.firstName} ${updateData.personalInfo.lastName}`,
        firstName: updateData.personalInfo.firstName,
        lastName: updateData.personalInfo.lastName,
        email: updateData.personalInfo.email,
        phone: updateData.personalInfo.phone || ''
      };
      
      const updatedUser = await User.findByIdAndUpdate(
        employeeDetails.userId, 
        updateUserData, 
        { new: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'Associated user not found' });
      }
      
      // Update Employee_Details record
      const updateEmployeeData = {
        'employment.department': updateData.employment.department,
        'employment.position': updateData.employment.position,
        'employment.salary': parseFloat(updateData.employment.salary),
        'employment.hireDate': updateData.employment.hireDate ? new Date(updateData.employment.hireDate) : employeeDetails.employment.hireDate,
        'employment.workSchedule': updateData.employment.workSchedule || employeeDetails.employment.workSchedule,
        'employment.status': updateData.employment.status || employeeDetails.employment.status,
        'employment.workingHours.startTime': updateData.employment.workingHours?.startTime || employeeDetails.employment.workingHours.startTime,
        'employment.workingHours.endTime': updateData.employment.workingHours?.endTime || employeeDetails.employment.workingHours.endTime,
        'employment.workingHours.lunchBreak': updateData.employment.workingHours?.lunchBreak || employeeDetails.employment.workingHours.lunchBreak
      };
      
      const updatedEmployeeDetails = await Employee_Details.findOneAndUpdate(
        { employeeId },
        { $set: updateEmployeeData },
        { new: true, runValidators: true }
      );
      
      // Return formatted response
      const employeeResponse = {
        employeeId: updatedEmployeeDetails.employeeId,
        personalInfo: {
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          phone: updatedUser.phone || 'Not provided'
        },
        employment: {
          position: updatedEmployeeDetails.employment.position,
          department: updatedEmployeeDetails.employment.department,
          hireDate: updatedEmployeeDetails.employment.hireDate,
          salary: updatedEmployeeDetails.employment.salary,
          workSchedule: updatedEmployeeDetails.employment.workSchedule,
          status: updatedEmployeeDetails.employment.status,
          workingHours: updatedEmployeeDetails.employment.workingHours
        },
        workload: updatedEmployeeDetails.workload,
        performanceMetrics: updatedEmployeeDetails.performanceMetrics,
        _isEmployeeDetails: true,
        _userId: updatedUser._id,
        _employeeDetailsId: updatedEmployeeDetails._id
      };
      
      return res.json({ message: 'Employee updated successfully', employee: employeeResponse });
    } 
    // Legacy support for USR- prefixed employees
    else if (employeeId.startsWith('USR-')) {
      const userId = employeeId.replace('USR-', '');
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Update user record
      const updateUserData = {
        name: `${updateData.personalInfo.firstName} ${updateData.personalInfo.lastName}`,
        firstName: updateData.personalInfo.firstName,
        lastName: updateData.personalInfo.lastName,
        email: updateData.personalInfo.email,
        phone: updateData.personalInfo.phone || ''
      };
      
      const updatedUser = await User.findByIdAndUpdate(userId, updateUserData, { new: true });
      
      // Return formatted response for legacy records
      const employeeResponse = {
        employeeId: `USR-${updatedUser._id}`,
        personalInfo: {
          firstName: updateData.personalInfo.firstName,
          lastName: updateData.personalInfo.lastName,
          email: updatedUser.email,
          phone: updatedUser.phone || 'Not provided'
        },
        employment: {
          position: updateData.employment?.position || 'Not specified',
          department: updateData.employment?.department || 'Not assigned',
          hireDate: updatedUser.createdAt,
          salary: updateData.employment?.salary || 0,
          workSchedule: updateData.employment?.workSchedule || 'Full-time',
          status: updateData.employment?.status || 'Active',
          workingHours: {
            startTime: '09:00',
            endTime: '17:00',
            lunchBreak: 60
          }
        },
        workload: {
          assignedOrders: 0,
          completedOrders: 0,
          activeOrders: 0,
          skills: [],
          availability: 'Available'
        },
        _isUserRecord: true,
        _userId: updatedUser._id
      };
      
      return res.json({ message: 'Employee updated successfully', employee: employeeResponse });
    } else {
      // Handle legacy Employee records
      const employee = await Employee.findOneAndUpdate(
        { employeeId },
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      return res.json({ message: 'Employee updated successfully', employee });
    }
  } catch (err) {
    console.error('Error updating employee:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Note: Keep exports at bottom. Below are lightweight endpoints used by the UI.

// Minimal workload update endpoint to prevent 404s during order assignment
// Accepts flexible payload:
// - deltaAssigned, deltaActive, deltaCompleted: numbers to increment by
// - assignedOrders, activeOrders, completedOrders: absolute values to set
// - availability: optional availability status
// FIXED workload update endpoint - this should be the only one being used
router.post('/employees/:employeeId/workload/update', async (req, res) => {
  try {
    console.log('=== WORKLOAD UPDATE ENDPOINT ===');
    const { employeeId } = req.params;
    const { action, orderId } = req.body || {};
    
    console.log('Employee ID:', employeeId);
    console.log('Action:', action);
    console.log('Order ID:', orderId);

    // Enhanced employee validation - use same logic as other endpoints
    let employee = await Employee_Details.findOne({ employee_id: employeeId });
    if (!employee) {
      console.log('Employee not found in Employee_Details, checking Employee...');
      employee = await Employee.findOne({ employeeId: employeeId });
      if (!employee) {
        console.log('Employee not found in Employee, checking User...');
        
        // For User model, extract user ID from USR-{userId} format
        let userId = employeeId;
        if (employeeId.startsWith('USR-')) {
          userId = employeeId.substring(4); // Remove 'USR-' prefix
        }
        
        const user = await User.findById(userId);
        if (user) {
          console.log('Found user, creating employee-like object for workload tracking');
          // Create a minimal employee object for workload tracking
          employee = {
            employeeId: employeeId, // Keep the full USR-{id} format
            _userId: user._id,
            workload: user.workload || { assignedOrders: 0, activeOrders: 0, completedOrders: 0, availability: 'Available' },
            save: async function() {
              // For users, we'll update the User model with workload info
              await User.findByIdAndUpdate(this._userId, { 
                workload: this.workload
              });
              return this;
            }
          };
        } else {
          console.log('Employee not found in any model');
          return res.status(404).json({ message: 'Employee not found' });
        }
      }
    }

    console.log('Employee found:', employee.employeeId || employee.employee_id);
    console.log('Current workload before update:', employee.workload);

    // Direct field update approach
    let newAssigned = employee.workload?.assignedOrders || 0;
    let newActive = employee.workload?.activeOrders || 0;
    let newCompleted = employee.workload?.completedOrders || 0;
    let newAvailability = employee.workload?.availability || 'Available';

    if (action === 'assign') {
      newAssigned += 1;
      newActive += 1;
      newAvailability = 'Busy';
    } else if (action === 'complete') {
      newCompleted += 1;
      newActive = Math.max(0, newActive - 1);
      newAvailability = newActive === 0 ? 'Available' : 'Busy';
    } else if (action === 'unassign') {
      newAssigned = Math.max(0, newAssigned - 1);
      newActive = Math.max(0, newActive - 1);
      newAvailability = newActive === 0 ? 'Available' : 'Busy';
    } else {
      return res.status(400).json({ message: 'Invalid action. Use assign, complete, or unassign' });
    }
    
    console.log('New values:', { newAssigned, newActive, newCompleted, newAvailability });

    // Update the employee workload based on the type
    if (employee._isUserRecord || employeeId.startsWith('USR-')) {
      // For User records, update directly and use custom save
      employee.workload.assignedOrders = newAssigned;
      employee.workload.activeOrders = newActive;
      employee.workload.completedOrders = newCompleted;
      employee.workload.availability = newAvailability;
      
      await employee.save();
      
      console.log('Updated user workload successfully');
      
      return res.json({
        message: 'Workload updated successfully',
        employeeId,
        workload: employee.workload
      });
    } else {
      // For Employee_Details or Employee records, use standard update
      const updateQuery = {
        $set: {
          'workload.assignedOrders': newAssigned,
          'workload.activeOrders': newActive,
          'workload.completedOrders': newCompleted,
          'workload.availability': newAvailability
        }
      };
      
      console.log('Update query:', JSON.stringify(updateQuery, null, 2));

      const updatedEmployee = await Employee.findOneAndUpdate(
        { employeeId },
        updateQuery,
        { 
          new: true,
          upsert: false,
          runValidators: true
        }
      );

      if (!updatedEmployee) {
        console.log('Update failed - employee not found');
        return res.status(404).json({ message: 'Employee not found during update' });
      }
      
      console.log('Updated employee workload:', updatedEmployee.workload);

      return res.json({
        message: 'Workload updated successfully',
        employeeId,
        workload: updatedEmployee.workload
      });
    }
  } catch (err) {
    console.error('Error updating workload:', err);
    return res.status(500).json({ message: 'Error updating workload', error: err.message });
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
    
    // Enhance salary records with employee information
    const enhancedSalaries = await Promise.all(salaries.map(async (salary) => {
      const salaryObj = salary.toObject();
      
      // Try to find employee information
      let employeeInfo = null;
      
      // First check Employee_Details (new system)
      const employeeDetails = await Employee_Details.findOne({ employeeId: salary.employeeId }).populate('userId');
      if (employeeDetails && employeeDetails.userId) {
        employeeInfo = {
          name: `${employeeDetails.userId.firstName} ${employeeDetails.userId.lastName}`,
          position: employeeDetails.employment.position || 'Not specified',
          department: employeeDetails.employment.department || 'Not assigned'
        };
      } else {
        // Check legacy Employee model
        const employee = await Employee.findOne({ employeeId: salary.employeeId });
        if (employee) {
          employeeInfo = {
            name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
            position: employee.employment.position || 'Not specified',
            department: employee.employment.department || 'Not assigned'
          };
        } else {
          // Check if it's a user-generated employee (USR- prefix)
          if (salary.employeeId.startsWith('USR-')) {
            const userId = salary.employeeId.replace('USR-', '');
            const user = await User.findById(userId);
            if (user && user.role === 'Employee') {
              employeeInfo = {
                name: user.name,
                position: 'Not specified',
                department: 'Not assigned'
              };
            }
          }
        }
      }
      
      // Add employee info to salary record
      salaryObj.employeeInfo = employeeInfo || {
        name: 'Unknown Employee',
        position: 'N/A',
        department: 'N/A'
      };
      
      return salaryObj;
    }));
    
    res.json(enhancedSalaries);
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
    
    // Check if employee exists (use new Employee_Details system or legacy Employee/User system)
    let employeeExists = false;
    
    // First check Employee_Details (new system)
    const employeeDetails = await Employee_Details.findOne({ employeeId: data.employeeId }).populate('userId');
    if (employeeDetails && employeeDetails.userId) {
      employeeExists = true;
    } else {
      // Check legacy Employee model
      const employee = await Employee.findOne({ employeeId: data.employeeId });
      if (employee) {
        employeeExists = true;
      } else {
        // Check if it's a user-generated employee (USR- prefix)
        if (data.employeeId.startsWith('USR-')) {
          const userId = data.employeeId.replace('USR-', '');
          const user = await User.findById(userId);
          if (user && user.role === 'Employee') {
            employeeExists = true;
          }
        }
      }
    }
    
    if (!employeeExists) {
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
    
    // Automatically create expense entry for salary
    try {
      const expenseData = {
        expenseId: 'EXP-SAL-' + Date.now(),
        category: 'Salaries',
        description: `Salary for Employee ${data.employeeId}`,
        amount: data.netSalary,
        date: new Date(),
        vendor: `Employee ${data.employeeId}`,
        paymentMethod: 'Bank Transfer',
        status: 'Paid',
        createdBy: 'System'
      };

      const expense = new Expense(expenseData);
      await expense.save();

      // Create ledger entry for expense
      const ledgerEntry = new LedgerEntry({
        entryId: 'LE-SAL-' + Date.now(),
        description: `Salary Expense: ${data.employeeId}`,
        reference: expenseData.expenseId,
        account: 'Expenses',
        credit: data.netSalary,
        category: 'Expense'
      });
      await ledgerEntry.save();

      console.log(`Automatically created expense entry for salary ${data.salaryId}: ${data.netSalary}`);
    } catch (expenseError) {
      console.error('Error creating expense entry for salary:', expenseError);
      // Don't fail the entire operation if expense creation fails
    }
    
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
