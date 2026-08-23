import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createProjectSchema, updateProjectSchema } from '../utils/validation';

const router = Router();

// All project routes require authentication
router.use(authenticate);

router.get('/', projectController.getAll);
router.post('/', validate(createProjectSchema), projectController.create);
router.get('/:id', projectController.getOne);
router.patch('/:id', validate(updateProjectSchema), projectController.update);
router.delete('/:id', requireAdmin, projectController.delete);
router.get('/:id/dashboard', projectController.getDashboard);

export default router;
