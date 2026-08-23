import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/availability', userController.getAvailability);

export default router;
