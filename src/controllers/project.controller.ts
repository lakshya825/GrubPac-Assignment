import { Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const projectController = {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      const projects = await projectService.getProjects(req.organizationId);
      res.json(projects);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      const project = await projectService.getProjectById(req.organizationId, req.params.id as string);
      res.json(project);
    } catch (err: any) {
      if (err.message === 'Project not found') return res.status(404).json({ error: err.message, code: 'PROJECT_NOT_FOUND', details: {} });
      next(err);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      const project = await projectService.createProject(req.organizationId, req.body);
      res.status(201).json(project);
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      const project = await projectService.updateProject(req.organizationId, req.params.id as string, req.body);
      res.json(project);
    } catch (err: any) {
      if (err.message === 'Project not found') return res.status(404).json({ error: err.message, code: 'PROJECT_NOT_FOUND', details: {} });
      next(err);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      await projectService.deleteProject(req.organizationId, req.params.id as string);
      res.status(204).send();
    } catch (err: any) {
      if (err.message === 'Project not found') return res.status(404).json({ error: err.message, code: 'PROJECT_NOT_FOUND', details: {} });
      next(err);
    }
  },

  async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      const dashboard = await projectService.getDashboard(req.organizationId, req.params.id as string);
      res.json(dashboard);
    } catch (err: any) {
      if (err.message === 'Project not found') return res.status(404).json({ error: err.message, code: 'PROJECT_NOT_FOUND', details: {} });
      next(err);
    }
  }
};
