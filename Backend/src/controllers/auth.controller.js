import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateToken } from '../utils/jwt.js';

// Public User Signup (First user created automatically becomes ADMIN, subsequent users become EMPLOYEE)
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, department } = req.body;

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw ApiError.badRequest('An account with this email already exists');
  }

  const userCount = await User.countDocuments();
  const role = userCount === 0 ? 'ADMIN' : 'EMPLOYEE';

  const user = await User.create({
    name,
    email,
    password,
    department: department || 'Compliance & Legal',
    role
  });

  const token = generateToken({ id: user._id, role: user.role });
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department
  };

  return ApiResponse.created(res, { user: userData, token }, 'Account created successfully');
});

// Bootstrap initial Admin or register an additional Admin
export const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingAdmin = await User.findOne({ role: 'ADMIN' });
  if (existingAdmin && (!req.user || req.user.role !== 'ADMIN')) {
    throw ApiError.forbidden('An Admin already exists. Only authenticated Admins can register another Admin.');
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw ApiError.badRequest('Email is already registered');
  }

  const admin = await User.create({
    name,
    email,
    password,
    role: 'ADMIN'
  });

  const token = generateToken({ id: admin._id, role: admin.role });
  const userData = {
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role
  };

  return ApiResponse.created(res, { user: userData, token }, 'Admin registered successfully');
});

// Admin creates an Employee account
export const createEmployee = asyncHandler(async (req, res) => {
  const { name, email, password, department } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.badRequest(`Email '${email}' is already registered`);
  }

  const employee = await User.create({
    name,
    email,
    password,
    department: department || 'Finance & Compliance',
    role: 'EMPLOYEE'
  });

  return ApiResponse.created(
    res,
    {
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department
    },
    'Employee account created successfully'
  );
});

// Admin lists all employee accounts
export const listEmployees = asyncHandler(async (req, res) => {
  const employees = await User.find({ role: 'EMPLOYEE' }).select('-password').sort({ createdAt: -1 });
  return ApiResponse.success(res, employees, 'Employees retrieved successfully');
});

// Login for Admin and Employee
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.status !== 'ACTIVE') {
    throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
  }

  const token = generateToken({
    id: user._id,
    role: user.role
  });

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    status: user.status
  };

  return ApiResponse.success(res, { user: userData, token }, 'Logged in successfully');
});

// Get current user profile
export const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, req.user, 'Current user profile fetched successfully');
});

// Admin creates any user account (ADMIN or EMPLOYEE)
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.badRequest(`Email '${email}' is already registered`);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'EMPLOYEE',
    department: department || (role === 'ADMIN' ? 'Compliance Administration' : 'Finance & Compliance')
  });

  return ApiResponse.created(
    res,
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      createdAt: user.createdAt
    },
    `${user.role === 'ADMIN' ? 'Administrator' : 'Employee'} account created successfully`
  );
});

// Admin lists all users with role statistics
export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ role: 1, createdAt: -1 });
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const employeeCount = users.filter((u) => u.role === 'EMPLOYEE').length;

  return ApiResponse.success(
    res,
    {
      users,
      totalUsers: users.length,
      adminCount,
      employeeCount
    },
    'Users list and statistics retrieved successfully'
  );
});

// Admin updates a user's role (promote to ADMIN or demote to EMPLOYEE)
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw ApiError.notFound('User not found');
  }

  // Safety check: Cannot demote the last remaining Admin
  if (targetUser.role === 'ADMIN' && role === 'EMPLOYEE') {
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    if (adminCount <= 1) {
      throw ApiError.badRequest(
        'Cannot demote the last remaining Administrator. At least one Administrator must exist to manage the system.'
      );
    }
  }

  targetUser.role = role;
  await targetUser.save();

  return ApiResponse.success(
    res,
    {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      department: targetUser.department
    },
    `User ${targetUser.name} has been ${role === 'ADMIN' ? 'promoted to Administrator' : 'changed to Employee'}`
  );
});

// Admin deletes a user account
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.user._id.toString() === id) {
    throw ApiError.badRequest('You cannot delete your own account while logged in as Administrator.');
  }

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw ApiError.notFound('User not found');
  }

  // Safety check: Cannot delete the last remaining Admin
  if (targetUser.role === 'ADMIN') {
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    if (adminCount <= 1) {
      throw ApiError.badRequest(
        'Cannot delete the last remaining Administrator. At least one Administrator must exist.'
      );
    }
  }

  await User.findByIdAndDelete(id);

  return ApiResponse.success(
    res,
    { _id: id, name: targetUser.name },
    `User account '${targetUser.name}' was successfully removed.`
  );
});
