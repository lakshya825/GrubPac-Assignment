import { Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const userController = {
  async getAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      
      const availability = await userService.getOrganizationUsersAvailability(req.organizationId);
      res.json(availability);
    } catch (err) {
      next(err);
    }
  }
};
