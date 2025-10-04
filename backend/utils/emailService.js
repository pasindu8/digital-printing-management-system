// Email service for authentication
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Environment driven config (DO NOT hardcode secrets)
const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SECURE,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  EMAIL_SERVICE, // optional (e.g. 'gmail')
  SEND_REAL_EMAIL // 'true' to actually send
} = process.env;

let transporter = null;
if (SEND_REAL_EMAIL === 'true') {
  try {
    const baseConfig = EMAIL_SERVICE ? { service: EMAIL_SERVICE } : { host: EMAIL_HOST, port: EMAIL_PORT ? Number(EMAIL_PORT) : 587, secure: EMAIL_SECURE === 'true' };
    transporter = nodemailer.createTransport({
      ...baseConfig,
      auth: EMAIL_USER && EMAIL_PASS ? { user: EMAIL_USER, pass: EMAIL_PASS } : undefined,
      tls: { rejectUnauthorized: false }
    });
    transporter.verify().then(()=>{
      console.log('📧 Email transporter ready');
    }).catch(err=>{
      console.warn('⚠️  Email transporter verify failed:', err.message);
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    transporter = null;
  }
} else {
  console.log('📧 Email sending in DEV / console mode (set SEND_REAL_EMAIL=true to actually send).');
}

// Send email function
const sendEmail = async (to, subject, htmlContent, textContent = '') => {
  console.log('\n📧 SENDING EMAIL...');
  console.log('=====================================');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('Mode:', SEND_REAL_EMAIL === 'true' ? 'REAL' : 'DEV-CONSOLE');
  console.log('=====================================\n');

  // Dev / console mode (default)
  if (SEND_REAL_EMAIL !== 'true') {
    console.log('📧 EMAIL CONTENT PREVIEW:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Content preview:', htmlContent.substring(0, 300) + '...');
    console.log('✅ (DEV MODE) Email logged to console, not actually sent');
    return {
      success: true,
      messageId: 'dev-console-' + Date.now(),
      note: 'Set SEND_REAL_EMAIL=true in .env to actually send emails.'
    };
  }

  // Real send path
  try {
    if (!transporter) throw new Error('Email transporter not configured');
    if (!to) throw new Error('Recipient email required');

    const mailOptions = {
      from: EMAIL_FROM || `"First Promovier" <${EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]+>/g, ' ').slice(0, 500)
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', result.messageId);
    return { success: true, messageId: result.messageId, envelope: result.envelope };
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Generate secure random token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate verification email content with code
const generateVerificationEmail = (name, verificationCode) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://i.ibb.co/cc6cS29N/logo-2.png" alt="First Promovier Logo" style="width: 100px; height: auto; margin-bottom: 10px;" />
        <h1 style="color: #33cc33;">First Promovier</h1>
        <p style="color: #6b7280;">Verify your email address</p>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin-bottom: 15px;">Hello ${name}!</h2>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          Thank you for signing up! Please verify your email address by entering the verification code below:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #3b82f6; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; display: inline-block; letter-spacing: 4px;">
            ${verificationCode}
          </div>
        </div>
        
          This code is valid for 15 minutes. Please enter it on the verification page to complete your registration.
        </p>
      </div>
      
      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          ⚠️ For security reasons, this verification code will expire in 15 minutes.
        </p>
      </div>
      
      <div style="text-align: center; color: #6b7280; font-size: 12px;">
        <p>If you didn't create an account, please ignore this email.</p>
        <p>For security, never share this code with anyone.</p>
      </div>
    </div>
  `;
};

// Generate password reset email content with code
const generatePasswordResetEmail = (name, resetCode) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://i.ibb.co/cc6cS29N/logo-2.png" alt="First Promovier Logo" style="width: 100px; height: auto; margin-bottom: 10px;" />
        <h1 style="color: #33cc33;">First Promovier</h1>
        <p style="color: #6b7280;">Reset your password</p>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin-bottom: 15px;">Hello ${name}!</h2>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          We received a request to reset the password for your account. 
          Please use the verification code below to reset your password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #dc2626; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; display: inline-block; letter-spacing: 4px;">
            ${resetCode}
          </div>
        </div>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
          This code is valid for 15 minutes. Please enter it on the password reset page to create a new password.
        </p>
      </div>
      
      <div style="background: #fef2f2; border: 1px solid #f87171; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
        <p style="color: #dc2626; font-size: 14px; margin: 0;">
          ⚠️ For security reasons, this reset code will expire in 15 minutes.
        </p>
      </div>
      
      <div style="text-align: center; color: #6b7280; font-size: 12px;">
        <p>If you didn't request a password reset, please ignore this email.</p>
        <p>For security, never share this code with anyone.</p>
      </div>
    </div>
  `;
};

// Generate invoice email content for approved payment
const generateInvoiceEmail = (customerName, order, invoiceUrl) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://i.ibb.co/cc6cS29N/logo-2.png" alt="First Promovier Logo" style="width: 100px; height: auto; margin-bottom: 10px;" />
        <h1 style="color: #33cc33;">First Promovier</h1>
        <p style="color: #6b7280;">Payment Confirmed - Invoice Ready</p>
      </div>
      
      <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #065f46; margin-bottom: 15px;">Hello ${customerName}!</h2>
        <p style="color: #047857; line-height: 1.6; margin-bottom: 20px;">
          Great news! Your payment has been verified and approved. Your order is now confirmed and processing.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #065f46; margin-bottom: 15px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #d1fae5;">
              <td style="padding: 8px 0; font-weight: bold; color: #065f46;">Order ID:</td>
              <td style="padding: 8px 0; color: #047857;">${order.orderId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #d1fae5;">
              <td style="padding: 8px 0; font-weight: bold; color: #065f46;">Order Date:</td>
              <td style="padding: 8px 0; color: #047857;">${new Date(order.orderDate).toLocaleDateString()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #d1fae5;">
              <td style="padding: 8px 0; font-weight: bold; color: #065f46;">Total Amount:</td>
              <td style="padding: 8px 0; color: #047857; font-weight: bold;">Rs. ${order.final_amount || order.total}</td>
            </tr>
            <tr style="border-bottom: 1px solid #d1fae5;">
              <td style="padding: 8px 0; font-weight: bold; color: #065f46;">Payment Status:</td>
              <td style="padding: 8px 0;"><span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">PAID</span></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #065f46;">Current Status:</td>
              <td style="padding: 8px 0; color: #047857;">${order.status}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invoiceUrl}" 
             style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
            Download Invoice
          </a>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/customer" 
             style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Dashboard
          </a>
        </div>
      </div>
      
      <div style="text-align: center; color: #6b7280; font-size: 12px;">
        <p>Thank you for choosing First Promovier for your printing needs!</p>
        <p>If you have any questions, please contact our support team.</p>
      </div>
    </div>
  `;
};

// Generate rejection email content for rejected payment
const generateRejectionEmail = (customerName, order, rejectionReason) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://i.ibb.co/cc6cS29N/logo-2.png" alt="First Promovier Logo" style="width: 100px; height: auto; margin-bottom: 10px;" />
        <h1 style="color: #33cc33;">First Promovier</h1>
        <p style="color: #6b7280;">Payment Receipt Review Update</p>
      </div>
      
      <div style="background: #fef2f2; border: 1px solid #f87171; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #991b1b; margin-bottom: 15px;">Hello ${customerName}!</h2>
        <p style="color: #dc2626; line-height: 1.6; margin-bottom: 20px;">
          We have reviewed your payment receipt for order <strong>${order.orderId}</strong>, but unfortunately we need to request additional information or clarification.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #991b1b; margin-bottom: 10px;">Reason for Review:</h3>
          <p style="color: #7f1d1d; font-style: italic; margin: 0;">${rejectionReason}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #991b1b; margin-bottom: 15px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #fecaca;">
              <td style="padding: 8px 0; font-weight: bold; color: #991b1b;">Order ID:</td>
              <td style="padding: 8px 0; color: #dc2626;">${order.orderId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #fecaca;">
              <td style="padding: 8px 0; font-weight: bold; color: #991b1b;">Order Date:</td>
              <td style="padding: 8px 0; color: #dc2626;">${new Date(order.orderDate).toLocaleDateString()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #fecaca;">
              <td style="padding: 8px 0; font-weight: bold; color: #991b1b;">Total Amount:</td>
              <td style="padding: 8px 0; color: #dc2626; font-weight: bold;">Rs. ${order.final_amount || order.total}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #991b1b;">Payment Status:</td>
              <td style="padding: 8px 0;"><span style="background: #dc2626; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">NEEDS REVIEW</span></td>
            </tr>
          </table>
        </div>
        
        <div style="background: #fef9c3; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="color: #92400e; margin: 0 0 10px 0;">Next Steps:</h4>
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            Please upload a new payment receipt or contact our support team for assistance. You can manage your order through the customer dashboard.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/customer" 
             style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
      </div>
      
      <div style="text-align: center; color: #6b7280; font-size: 12px;">
        <p>If you have any questions about this review, please contact our support team.</p>
        <p>We're here to help ensure your order processes smoothly.</p>
      </div>
    </div>
  `;
};

module.exports = {
  sendEmail,
  generateToken,
  generateVerificationCode,
  generateVerificationEmail,
  generatePasswordResetEmail,
  generateInvoiceEmail,
  generateRejectionEmail
};
