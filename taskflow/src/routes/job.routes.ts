import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { emailQueue } from '../jobs/queue';

const router = Router();

router.use(authenticate);

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await emailQueue.getJob(req.params.id as string);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const isFailed = state === 'failed';
    const isCompleted = state === 'completed';
    
    res.json({
      id: job.id,
      status: state, // pending, active, completed, failed
      failedReason: isFailed ? job.failedReason : undefined,
      data: job.data,
      returnvalue: isCompleted ? job.returnvalue : undefined
    });
  } catch (err) {
    next(err);
  }
});

export default router;
