import { Router } from 'express';
import {
  signup,
  registerAdmin,
  createEmployee,
  listEmployees,
  createUser,
  listUsers,
  updateUserRole,
  deleteUser,
  login,
  getMe
} from '../controllers/auth.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  signupSchema,
  registerAdminSchema,
  createEmployeeSchema,
  createUserSchema,
  updateRoleSchema,
  loginSchema
} from '../validators/auth.validator.js';

const router = Router();

// Public User Signup (First user becomes Admin, subsequent users become Employees)
router.post(
  '/signup',
  authRateLimiter,
  validate(signupSchema),
  signup
);

// Register Admin (initial setup or Admin adding Admin)
router.post(
  '/register-admin',
  validate(registerAdminSchema),
  registerAdmin
);

// Admin creates an Employee account
router.post(
  '/create-employee',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(createEmployeeSchema),
  createEmployee
);

// Admin lists all employees
router.get(
  '/employees',
  authenticate,
  authorizeRoles('ADMIN'),
  listEmployees
);

// Admin creates any user (ADMIN or EMPLOYEE)
router.post(
  '/users',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(createUserSchema),
  createUser
);

// Admin lists all users with role statistics
router.get(
  '/users',
  authenticate,
  authorizeRoles('ADMIN'),
  listUsers
);

// Admin updates a user's role (promote/demote)
router.patch(
  '/users/:id/role',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(updateRoleSchema),
  updateUserRole
);

// Admin deletes a user account
router.delete(
  '/users/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  deleteUser
);

// Login for Admin and Employee
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  login
);

// Get current profile
router.get(
  '/me',
  authenticate,
  getMe
);

export default router;
