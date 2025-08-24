import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
  paginationSchema,
  searchSchema,
  idParamSchema,
} from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validateRequest(userRegistrationSchema), UserController.register);
router.post('/login', validateRequest(userLoginSchema), UserController.login);

// Protected routes
router.get('/profile', authenticateToken, UserController.getProfile);
router.put('/profile', authenticateToken, validateRequest(userUpdateSchema), UserController.updateProfile);
router.get('/teams', authenticateToken, UserController.getMyTeams);
router.put('/change-password', authenticateToken, UserController.changePassword);
router.delete('/:id', authenticateToken, validateRequest(idParamSchema), UserController.deleteUser);

// Public routes with optional authentication
router.get('/:id', validateRequest(idParamSchema), UserController.getUserById);
router.get('/:id/teams', validateRequest(idParamSchema), UserController.getUserWithTeams);

// Admin/Public routes
router.get('/', validateRequest(paginationSchema), validateRequest(searchSchema), UserController.getUsers);

export default router;
