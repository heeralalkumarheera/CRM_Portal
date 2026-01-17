import User from '../models/User.js';
import { sendTokenResponse, verifyRefreshToken, generateAccessToken } from '../utils/jwtHelper.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { createAuditLog } from '../middleware/auditLog.js';
import { sendOTPEmail, sendWelcomeEmail } from '../utils/emailService.js';

// @desc    Register user (Step 1: Send OTP)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role, department } = req.body;

    // Validate role
    const allowedRoles = ['Super Admin', 'Admin', 'Sales Executive', 'Accountant', 'Manager', 'Support Staff'];
    if (!role || !allowedRoles.includes(role)) {
      return errorResponse(res, 'Please select a valid role', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return errorResponse(res, 'Email already registered', 400);
      }
      // If email not verified, allow re-sending OTP
      const otp = existingUser.generateOTP();
      await existingUser.save({ validateBeforeSave: false });
      await sendOTPEmail(email, otp, 'verification');
      return successResponse(res, { tempUserId: existingUser._id }, 'OTP sent to your email. Please verify to complete registration.');
    }

    // Create user (not verified yet)
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      department,
      isEmailVerified: false,
      createdBy: req.user?._id
    });

    // Generate and send OTP
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });
    await sendOTPEmail(email, otp, 'verification');

    return successResponse(res, { tempUserId: user._id }, 'Registration initiated. OTP sent to your email.', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res, next) => {
  try {
    const { tempUserId, otp } = req.body;

    if (!tempUserId || !otp) {
      return errorResponse(res, 'User ID and OTP are required', 400);
    }

    const user = await User.findById(tempUserId);
    if (!user) {
      return errorResponse(res, 'Invalid user', 404);
    }

    if (user.isEmailVerified) {
      return errorResponse(res, 'Email already verified', 400);
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return errorResponse(res, 'Invalid or expired OTP', 400);
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.clearOTP();
    await user.save({ validateBeforeSave: false });

    // Send welcome email
    await sendWelcomeEmail(user.email, user.firstName, user.role);

    // Create audit log
    await createAuditLog({
      user: user._id,
      action: 'CREATE',
      module: 'User',
      recordId: user._id,
      description: `User registered and verified: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await sendTokenResponse(user, 200, res, 'Email verified successfully. Registration complete!');
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.isEmailVerified) {
      return errorResponse(res, 'Email already verified', 400);
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });
    await sendOTPEmail(email, otp, 'verification');

    successResponse(res, { tempUserId: user._id }, 'OTP resent successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Validate email, password, and role
    if (!email || !password || !role) {
      return errorResponse(res, 'Please provide email, password, and role', 400);
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return errorResponse(res, `User not found with email: ${email}`, 401);
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      console.log(`❌ Login blocked: Email not verified for ${email}`);
      return errorResponse(res, `Email not verified. Please verify your email first. Registered as: ${user.role}`, 401);
    }

    // Check if role matches
    if (user.role !== role) {
      console.log(`❌ Login blocked: Role mismatch. User registered as "${user.role}" but trying to login as "${role}"`);
      return errorResponse(res, `Role mismatch. You registered as "${user.role}" but trying to login as "${role}". Please select the correct role.`, 401);
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      console.log(`❌ Login blocked: Account locked for ${email}`);
      return errorResponse(res, 'Account locked due to multiple failed login attempts. Please try again later.', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      console.log(`❌ Login blocked: User deactivated ${email}`);
      return errorResponse(res, 'Your account has been deactivated. Please contact administrator.', 401);
    }

    // Check if password matches
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      console.log(`❌ Login blocked: Invalid password for ${email}`);
      // Increment failed login attempts
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.accountLocked = true;
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      await user.save({ validateBeforeSave: false });

      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    user.accountLocked = false;
    user.lockedUntil = null;
    user.lastLogin = new Date();

    // Add to login history
    user.loginHistory = user.loginHistory || [];
    user.loginHistory.push({
      timestamp: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    // Keep only last 10 login records
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(-10);
    }

    await user.save({ validateBeforeSave: false });

    console.log(`✅ Login successful for ${email} as ${user.role}`);

    // Create audit log
    await createAuditLog({
      user: user._id,
      action: 'LOGIN',
      module: 'Auth',
      description: `User logged in: ${user.email} as ${user.role}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 'Refresh token required', 400);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);

    if (!tokenExists) {
      return errorResponse(res, 'Invalid refresh token', 401);
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    successResponse(res, { accessToken: newAccessToken }, 'Token refreshed successfully');
  } catch (error) {
    errorResponse(res, 'Invalid or expired refresh token', 401);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token from user
      const user = await User.findById(req.user._id);
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
      await user.save({ validateBeforeSave: false });
    }

    // Create audit log
    await createAuditLog({
      user: req.user._id,
      action: 'LOGOUT',
      module: 'Auth',
      description: `User logged out: ${req.user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    successResponse(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    successResponse(res, user, 'User data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Please provide current and new password', 400);
    }

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      return errorResponse(res, 'Current password is incorrect', 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Create audit log
    await createAuditLog({
      user: user._id,
      action: 'UPDATE',
      module: 'Auth',
      description: 'Password updated',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await sendTokenResponse(user, 200, res, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });
    await sendOTPEmail(email, otp, 'reset');

    successResponse(res, { resetUserId: user._id }, 'Password reset OTP sent to your email');
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { resetUserId, otp, newPassword } = req.body;

    if (!resetUserId || !otp || !newPassword) {
      return errorResponse(res, 'User ID, OTP, and new password are required', 400);
    }

    const user = await User.findById(resetUserId);
    if (!user) {
      return errorResponse(res, 'Invalid user', 404);
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return errorResponse(res, 'Invalid or expired OTP', 400);
    }

    // Update password
    user.password = newPassword;
    user.clearOTP();
    user.failedLoginAttempts = 0;
    user.accountLocked = false;
    user.lockedUntil = null;
    await user.save();

    // Create audit log
    await createAuditLog({
      user: user._id,
      action: 'UPDATE',
      module: 'Auth',
      description: 'Password reset via OTP',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    successResponse(res, null, 'Password reset successfully. You can now login with your new password.');
  } catch (error) {
    next(error);
  }
};
