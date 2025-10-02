const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate a random password
function generatePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
  
  // Fill remaining length
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Create email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates for development
    },
    secure: false // Use TLS but not require secure connection
  });
};

// Send welcome email to new employee
async function sendEmployeeWelcomeEmail(employeeData, password) {
  try {
    console.log(`Preparing to send welcome email to: ${employeeData.email}`);
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: employeeData.email,
      subject: 'Welcome to the Company - Your Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Welcome to Our Company!</h2>
          
          <p>Dear ${employeeData.firstName} ${employeeData.lastName},</p>
          
          <p>We are pleased to inform you that your employee account has been successfully created. Below are your login credentials:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${employeeData.email}</p>
            <p><strong>Password:</strong> <code style="background-color: #e8e8e8; padding: 2px 6px; border-radius: 3px;">${password}</code></p>
            <p><strong>Employee ID:</strong> ${employeeData.employeeId}</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffeaa7;">
            <h4 style="margin-top: 0; color: #856404;">Important Security Notice:</h4>
            <ul style="color: #856404; margin: 0;">
              <li>Please change your password after your first login</li>
              <li>Keep your credentials secure and do not share them with anyone</li>
              <li>If you have any issues accessing your account, contact IT support</li>
            </ul>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Your Employment Details:</h3>
            <p><strong>Position:</strong> ${employeeData.position}</p>
            <p><strong>Department:</strong> ${employeeData.department}</p>
            <p><strong>Start Date:</strong> ${new Date(employeeData.hireDate).toLocaleDateString()}</p>
          </div>
          
          <p>You can access the company portal at: <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #007bff;">${process.env.FRONTEND_URL || 'http://localhost:3000'}</a></p>
          
          <p>We look forward to working with you!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="color: #666; font-size: 12px; text-align: center;">
            This is an automated message. Please do not reply to this email.<br>
            If you need assistance, please contact our HR department.
          </p>
        </div>
      `
    };
    
    console.log('Sending email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error.message);
    console.error('Full error details:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  generatePassword,
  sendEmployeeWelcomeEmail,
  createEmailTransporter
};