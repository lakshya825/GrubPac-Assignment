import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

const router = Router();

// Public endpoint to get available organizations
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true
      }
    });
    res.json(orgs);
  } catch (err) {
    next(err);
  }
});

export default router;
