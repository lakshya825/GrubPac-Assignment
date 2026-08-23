import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createTaskSchema, updateTaskSchema, assignTaskSchema, addCommentSchema } from '../utils/validation';

const router = Router();

// All task routes require authentication
router.use(authenticate);

router.get('/', taskController.getAll);
router.post('/', validate(createTaskSchema), taskController.create);
router.get('/:id', taskController.getOne);
router.patch('/:id', validate(updateTaskSchema), taskController.update);
router.delete('/:id', taskController.delete);

router.post('/:id/assign', validate(assignTaskSchema), taskController.assign);
router.delete('/:id/assign/:userId', taskController.unassign);

router.post('/:id/comments', validate(addCommentSchema), taskController.addComment);
router.get('/:id/comments', taskController.getComments);

export default router;
