import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { createAuditLog } from '../middleware/auditLog.js';

// @desc    Admin create user with specific role
// @route   POST /api/users
// @access  Private (Super Admin, Admin)
export const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role, department, isActive } = req.body;

    if (!firstName || !lastName || !email || !password || !phone || !role) {
      return errorResponse(res, 'firstName, lastName, email, phone, password and role are required', 400);
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return errorResponse(res, 'Email already registered', 400);
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      department,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user?._id
    });

    await createAuditLog({
      user: req.user?._id,
      action: 'CREATE',
      module: 'User',
      recordId: user._id,
      description: `User created (${role}): ${email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    successResponse(res, user, 'User created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    List users (basic)
// @route   GET /api/users
// @access  Private (Super Admin, Admin)
export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    successResponse(res, users, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role/status
// @route   PUT /api/users/:id
// @access  Private (Super Admin, Admin)
export const updateUser = async (req, res, next) => {
  try {
    const { role, isActive, department } = req.body;
    const update = {};
    if (role) update.role = role;
    if (typeof isActive === 'boolean') update.isActive = isActive;
    if (department !== undefined) update.department = department;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return errorResponse(res, 'User not found', 404);

    await createAuditLog({
      user: req.user?._id,
      action: 'UPDATE',
      module: 'User',
      recordId: user._id,
      description: `User updated: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    successResponse(res, user, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};
