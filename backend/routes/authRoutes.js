const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Customer = require('../models/Customer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { sendEmail, generateToken, generateVerificationCode, generateVerificationEmail, generatePasswordResetEmail } = require('../utils/emailService');

// Register with email verification
router.post('/register', async (req, res) => {
  try {
    console.log('🔄 Registration request received:', req.body);
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateToken();
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: role || 'Customer',
      verificationToken,
      verificationTokenExpires: verificationExpires,
      verificationCode,
      verificationCodeExpires: verificationExpires
    });
    
    await user.save();
    
    // If user role is Customer, create a customer record
    if (role === 'Customer') {
      try {
        const customer = new Customer({
          customerId: 'CUST-' + Date.now(),
          name: name,
          email: email,
          password: hashedPassword, // Same password as user account
          phone: '', // Will be updated later by customer
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: ''
          },
          email_verified: false // Will be updated when user verifies email
        });
        
        await customer.save();
        console.log('Customer record created for user:', email);
      } catch (customerErr) {
        console.error('Failed to create customer record:', customerErr);
        // Continue with user registration even if customer creation fails
      }
    }
    
    // Send verification email with code
    const emailContent = generateVerificationEmail(name, verificationCode);
    
    const emailResult = await sendEmail(
      email,
      'Verify Your Email - Digital Printing Management System',
      emailContent
    );
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Still return success but note email issue
      return res.json({ 
        message: 'User registered successfully, but verification email could not be sent. Please contact support.',
        emailSent: false 
      });
    }
    
    res.json({ 
      message: 'User registered successfully. Please check your email to verify your account.',
      emailSent: true 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Email verification endpoint (supports both token and code)
router.post('/verify-email', async (req, res) => {
  try {
    const { token, code } = req.body;
    
    let user = null;
    
    // Check if verification is by code or token
    if (code) {
      user = await User.findOne({
        verificationCode: code,
        verificationCodeExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.status(400).json({ 
          message: 'Invalid or expired verification code' 
        });
      }
    } else if (token) {
      user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.status(400).json({ 
          message: 'Invalid or expired verification token' 
        });
      }
    } else {
      return res.status(400).json({ 
        message: 'Verification code or token is required' 
      });
    }
    
    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();
    
    // If user is a customer, update customer record as well
    if (user.role === 'Customer') {
      try {
        await Customer.updateOne(
          { email: user.email },
          { email_verified: true }
        );
        console.log('Customer email verification updated for:', user.email);
      } catch (customerErr) {
        console.error('Failed to update customer email verification:', customerErr);
      }
    }
    
    res.json({ message: 'Email verified successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    const verificationToken = generateToken();
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationExpires;
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationExpires;
    await user.save();
    
    // Send verification email with code
    const emailContent = generateVerificationEmail(user.name, verificationCode);
    
    const emailResult = await sendEmail(
      email,
      'Verify Your Email - Digital Printing Management System',
      emailContent
    );
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again later.',
        emailSent: false 
      });
    }
    
    res.json({ message: 'Verification email sent successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    console.log('📧 Forgot password request received for:', req.body.email);
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email address' });
    }
    
    console.log('✅ User found:', user.name);
    
    const resetToken = generateToken();
    const resetCode = generateVerificationCode();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    user.resetPasswordCode = resetCode;
    user.resetPasswordCodeExpires = resetExpires;
    await user.save();
    
    console.log('✅ Reset code generated and saved');
    
    // Send password reset email with code
    const emailContent = generatePasswordResetEmail(user.name, resetCode);
    
    console.log('📧 Attempting to send email...');
    const emailResult = await sendEmail(
      email,
      'Reset Your Password - Digital Printing Management System',
      emailContent
    );
    
    console.log('📧 Email result:', emailResult);
    
    if (!emailResult.success) {
      console.log('❌ Email sending failed');
      return res.status(500).json({ 
        message: 'Failed to send password reset email. Please try again later.',
        emailSent: false,
        error: emailResult.error || 'Unknown email error'
      });
    }
    
    console.log('✅ Password reset process completed successfully');
    res.json({ 
      message: 'Password reset code sent successfully to your email!',
      emailSent: true
    });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ 
      message: 'An error occurred while processing your request: ' + err.message,
      error: err.message 
    });
  }
});

// Reset password (supports both token and code)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, code, newPassword } = req.body;
    
    let user = null;
    
    // Check if reset is by code or token
    if (code) {
      user = await User.findOne({
        resetPasswordCode: code,
        resetPasswordCodeExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.status(400).json({ 
          message: 'Invalid or expired password reset code' 
        });
      }
    } else if (token) {
      user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.status(400).json({ 
          message: 'Invalid or expired password reset token' 
        });
      }
    } else {
      return res.status(400).json({ 
        message: 'Password reset code or token is required' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.resetPasswordCode = null;
    user.resetPasswordCodeExpires = null;
    await user.save();
    
    res.json({ message: 'Password reset successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login with email verification check
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Check if email is verified (skip for OAuth users)
    if (!user.emailVerified && user.provider === 'local') {
      return res.status(400).json({ 
        message: 'Please verify your email before logging in',
        emailNotVerified: true 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      token, 
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// OAuth Routes (Real implementation)
// Google OAuth
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login?error=oauth_failed' }),
  async (req, res) => {
    try {
      if (!req.user) {
        console.error('No user found in Google OAuth callback');
        return res.redirect('http://localhost:3000/login?error=user_not_found');
      }

      // Generate JWT token for the authenticated user
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      const userPayload = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        provider: req.user.provider,
        emailVerified: req.user.emailVerified
      };

      console.log(`Google OAuth success for user: ${req.user.email} with role: ${req.user.role}`);

      // Redirect to frontend with token
      res.redirect(`http://localhost:3000/login?token=${token}&user=${encodeURIComponent(JSON.stringify(userPayload))}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('http://localhost:3000/login?error=oauth_error');
    }
  }
);

// GitHub OAuth - Real implementation
router.get('/github', 
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: 'http://localhost:3000/login?error=oauth_failed' }),
  async (req, res) => {
    try {
      if (!req.user) {
        console.error('No user found in GitHub OAuth callback');
        return res.redirect('http://localhost:3000/login?error=user_not_found');
      }

      // Generate JWT token for the authenticated user
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      const userPayload = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        provider: req.user.provider,
        emailVerified: req.user.emailVerified
      };

      console.log(`GitHub OAuth success for user: ${req.user.email} with role: ${req.user.role}`);

      // Redirect to frontend with token
      res.redirect(`http://localhost:3000/login?token=${token}&user=${encodeURIComponent(JSON.stringify(userPayload))}`);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      res.redirect('http://localhost:3000/login?error=oauth_error');
    }
  }
);

module.exports = router;
