import { Response, NextFunction } from 'express';
import { taskService } from '../services/task.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const taskController = {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      
      const filters = {
        status: req.query.status as any,
        priority: req.query.priority as any,
        assigneeId: req.query.assigneeId as string,
        dueDateStart: req.query.dueDateStart ? new Date(req.query.dueDateStart as string) : undefined,
        dueDateEnd: req.query.dueDateEnd ? new Date(req.query.dueDateEnd as string) : undefined,
        search: req.query.search as string,
      };

      const pagination = {
        limit: parseInt((req.query.limit as string) || '20'),
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        cursor: req.query.cursor as string,
      };

      const tasks = await taskService.getTasks(req.organizationId, filters, pagination);
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      const task = await taskService.getTaskById(req.organizationId, req.params.id as string);
      res.json(task);
    } catch (err: any) {
      if (err.message === 'Task not found') return res.status(404).json({ error: err.message, code: 'TASK_NOT_FOUND', details: {} });
      next(err);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      const task = await taskService.createTask(req.organizationId, req.body);
      res.status(201).json(task);
    } catch (err: any) {
      if (err.message === 'Project not found') return res.status(404).json({ error: err.message, code: 'PROJECT_NOT_FOUND', details: {} });
      next(err);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      const task = await taskService.updateTask(req.organizationId, req.params.id as string, req.body);
      res.json(task);
    } catch (err: any) {
      if (err.message === 'Task not found') return res.status(404).json({ error: err.message, code: 'TASK_NOT_FOUND', details: {} });
      next(err);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      await taskService.deleteTask(req.organizationId, req.params.id as string);
      res.status(204).send();
    } catch (err: any) {
      if (err.message === 'Task not found') return res.status(404).json({ error: err.message, code: 'TASK_NOT_FOUND', details: {} });
      next(err);
    }
  },

  async assign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      const responsePayload = await taskService.assignUser(req.organizationId, req.params.id as string, req.body.userId);
      res.status(201).json(responsePayload);
    } catch (err: any) {
      if (err.message === 'Task not found') return res.status(404).json({ error: err.message, code: 'TASK_NOT_FOUND', details: {} });
      if (err.message === 'Assigned user does not belong to the organization') return res.status(400).json({ error: err.message });
      next(err);
    }
  },

  async unassign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      await taskService.unassignUser(req.organizationId, req.params.id as string, req.params.userId as string);
      res.status(204).send();
    } catch (err: any) {
      if (err.message === 'Task not found') return res.status(404).json({ error: err.message, code: 'TASK_NOT_FOUND', details: {} });
      next(err);
    }
  },

  async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      
      const comment = await taskService.addComment(req.organizationId, req.params.id as string, req.user.id, req.body.content);
      res.status(201).json(comment);
    } catch (err: any) {
      if (err.message === 'Task not found') return res.status(404).json({ error: err.message, code: 'TASK_NOT_FOUND', details: {} });
      next(err);
    }
  },

  async getComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.organizationId) return res.status(403).json({ error: 'No organization context' });
      
      const comments = await taskService.getComments(req.organizationId, req.params.id as string);
      res.json(comments);
    } catch (err: any) {
      if (err.message === 'Task not found') return res.status(404).json({ error: err.message, code: 'TASK_NOT_FOUND', details: {} });
      next(err);
    }
  }
};
