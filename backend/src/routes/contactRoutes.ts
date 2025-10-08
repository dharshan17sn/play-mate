import { Router } from 'express';
import { ContactController } from '../controllers/contactController';

const router = Router();

router.post('/', ContactController.submit);

export default router;


