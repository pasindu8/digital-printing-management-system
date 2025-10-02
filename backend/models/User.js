const mongoose = require('mongoose');

// prefer native bcrypt if installed, fall back to bcryptjs
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (err) {
  bcrypt = require('bcryptjs');
}

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // Full name (firstName + lastName)
  firstName: { type: String, trim: true }, // Separate first name field
  lastName: { type: String, trim: true }, // Separate last name field
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true }, // Phone number field
  password: { type: String, required: function() { return !this.googleId && !this.githubId && this.provider !== 'hr'; } }, // Password not required for OAuth users or HR-created employees
  role: { type: String, enum: ['Admin', 'General_Manager', 'Order_Manager', 'Stock_Manager', 'HR_Manager', 'Delivery_Person', 'Staff', 'Employee', 'Customer'], default: 'Employee' },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationTokenExpires: { type: Date, default: null },
  verificationCode: { type: String, default: null },
  verificationCodeExpires: { type: Date, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  resetPasswordCode: { type: String, default: null },
  resetPasswordCodeExpires: { type: Date, default: null },
  
  // OAuth fields
  googleId: { type: String, sparse: true },
  githubId: { type: String, sparse: true },
  avatar: { type: String },
  provider: { type: String, enum: ['local', 'google', 'github', 'hr'], default: 'local' },
}, { timestamps: true });

// Only hash when password is modified and not already hashed
UserSchema.pre('save', async function (next) {
  // Skip password hashing for OAuth users
  if (!this.password || !this.isModified('password')) return next();

  const pwd = this.password || '';
  if (typeof pwd === 'string' && /^\$2[aby]\$/.test(pwd)) {
    // already hashed
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare plaintext password with hashed password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
