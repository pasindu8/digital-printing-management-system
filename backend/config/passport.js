const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const Customer = require('../models/Customer');

// Helper function to determine user role and create customer record if needed
async function handleOAuthUserCreation(userData) {
  // Default to Customer for OAuth users unless they have a company email
  const isCompanyEmail = userData.email && (
    userData.email.includes('@company.com') || // Add your company domain
    userData.email.includes('@firstpromovier.com') // Example company domain
  );
  
  const userRole = isCompanyEmail ? 'Employee' : 'Customer';
  
  const user = new User({
    ...userData,
    role: userRole,
    emailVerified: true
  });
  
  await user.save();
  
  // Create Customer record if the user is a customer
  if (userRole === 'Customer') {
    try {
      const customer = new Customer({
        customerId: 'CUST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        name: userData.name,
        email: userData.email,
        password: 'oauth-user-' + Math.random().toString(36), // Dummy password for OAuth users
        phone: '', // Will be updated later by customer
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'Sri Lanka'
        },
        email_verified: true, // OAuth users have verified emails
        account_status: 'active'
      });
      
      await customer.save();
      console.log(`Customer record created for OAuth user: ${userData.email}`);
    } catch (customerErr) {
      console.error('Failed to create customer record for OAuth user:', customerErr);
      // Continue even if customer creation fails
    }
  }
  
  console.log(`New ${userData.provider} OAuth user created: ${user.email} with role: ${userRole} and ID: ${user._id}`);
  return user;
}

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    // Check if user exists with same email
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.emailVerified = true; // Mark email as verified since they logged in via Google
      await user.save();
      console.log(`Google account linked to existing user: ${user.email}`);
      return done(null, user);
    }
    
    // Create new user using helper function
    const userData = {
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      avatar: profile.photos[0].value,
      provider: 'google'
    };
    
    user = await handleOAuthUserCreation(userData);
    return done(null, user);
    
  } catch (error) {
    return done(error, null);
  }
}));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ githubId: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    // Check if user exists with same email
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.local`;
    user = await User.findOne({ email: email });
    
    if (user) {
      // Link GitHub account to existing user
      user.githubId = profile.id;
      user.emailVerified = true; // Mark email as verified since they logged in via GitHub
      await user.save();
      console.log(`GitHub account linked to existing user: ${user.email}`);
      return done(null, user);
    }
    
    // Create new user using helper function
    const userData = {
      githubId: profile.id,
      name: profile.displayName || profile.username,
      email: email,
      avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
      provider: 'github'
    };
    
    user = await handleOAuthUserCreation(userData);
    return done(null, user);
    
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
