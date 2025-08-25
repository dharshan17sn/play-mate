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
  userSearchSchema,
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
router.delete('/:user_id', authenticateToken, validateRequest(idParamSchema), UserController.deleteUser);

// Public routes with optional authentication
router.get('/:user_id', validateRequest(idParamSchema), UserController.getUserById);
router.get('/:user_id/teams', validateRequest(idParamSchema), UserController.getUserWithTeams);

// Admin/Public routes
router.get('/', validateRequest(paginationSchema), validateRequest(userSearchSchema), UserController.getUsers);
router.get('/search', validateRequest(userSearchSchema), UserController.searchUsers);

export default router;
