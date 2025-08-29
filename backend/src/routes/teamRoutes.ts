import { Router } from 'express';
import { TeamController } from '../controllers/teamController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  teamCreateSchema,
  teamUpdateSchema,
  paginationSchema,
  searchSchema,
  teamIdParamSchema,
} from '../middleware/validation';

const router = Router();

// All team routes require authentication
router.use(authenticateToken);

// Team CRUD operations
router.post('/', validateRequest(teamCreateSchema), TeamController.createTeam);
router.get('/my', TeamController.getMyTeams);
router.get('/all', validateRequest(paginationSchema), validateRequest(searchSchema), TeamController.getAllTeams);

// Team operations by ID
router.get('/:teamId', validateRequest(teamIdParamSchema), TeamController.getTeamById);
router.put('/:teamId', validateRequest(teamIdParamSchema), validateRequest(teamUpdateSchema), TeamController.updateTeam);
router.delete('/:teamId', validateRequest(teamIdParamSchema), TeamController.deleteTeam);

// Public team routes (no authentication required)
router.get('/user/:userId', TeamController.getTeamsByUserId);

export default router;
