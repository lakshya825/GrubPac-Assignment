import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, organizationId } = req.body;
      const result = await authService.register(email, password, name, organizationId);
      res.status(201).json(result);
    } catch (err: any) {
      if (err.message === 'Email is already in use') {
        res.status(409).json({ error: err.message });
      } else {
        next(err);
      }
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json(result);
    } catch (err: any) {
      if (err.message === 'Invalid credentials') {
        res.status(401).json({ error: err.message });
      } else {
        next(err);
      }
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
};
