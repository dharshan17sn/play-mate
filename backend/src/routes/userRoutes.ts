import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  userLoginSchema,
  userUpdateSchema,
  paginationSchema,
  searchSchema,
  userSearchSchema,
  idParamSchema,
  requestOtpSchema,
  verifyOtpSchema,
  forgotPasswordRequestSchema,
  forgotPasswordResetSchema,
} from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register/request-otp', validateRequest(requestOtpSchema), UserController.requestRegistrationOtp);
router.post('/register/verify-otp', validateRequest(verifyOtpSchema), UserController.verifyRegistrationOtp);
router.post('/login', validateRequest(userLoginSchema), UserController.login);
router.post('/forgot-password/request-otp', validateRequest(forgotPasswordRequestSchema), UserController.requestForgotPasswordOtp);
router.post('/forgot-password/reset', validateRequest(forgotPasswordResetSchema), UserController.resetForgotPassword);

// Admin/Public routes (place static routes before dynamic parameter routes)
router.get('/search', validateRequest(userSearchSchema), UserController.searchUsers);
router.get('/', validateRequest(paginationSchema), validateRequest(userSearchSchema), UserController.getUsers);

// Protected routes
router.get('/profile', authenticateToken, UserController.getProfile);
router.put('/profile', authenticateToken, validateRequest(userUpdateSchema), UserController.updateProfile);
router.get('/teams', authenticateToken, UserController.getMyTeams);
router.put('/change-password', authenticateToken, UserController.changePassword);
router.delete('/:user_id', authenticateToken, validateRequest(idParamSchema), UserController.deleteUser);

// Public routes with optional authentication
router.get('/:user_id/teams', validateRequest(idParamSchema), UserController.getUserWithTeams);
router.get('/:user_id', validateRequest(idParamSchema), UserController.getUserById);

export default router;
