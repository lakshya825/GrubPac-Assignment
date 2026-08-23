import prisma from '../utils/prisma';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { getOffsetPagination, getCursorPagination, formatCursorResponse } from '../utils/pagination';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDateStart?: Date;
  dueDateEnd?: Date;
  search?: string;
}

export const taskService = {
  async getTasks(
    organizationId: string,
    filters: TaskFilters,
    pagination: { limit: number; page?: number; cursor?: string }
  ) {
    const { limit, page, cursor } = pagination;

    // Base where clause ensuring org isolation via project
    const where: any = {
      project: { organizationId },
      deletedAt: null,
    };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.dueDateStart || filters.dueDateEnd) {
      where.dueDate = {};
      if (filters.dueDateStart) where.dueDate.gte = filters.dueDateStart;
      if (filters.dueDateEnd) where.dueDate.lte = filters.dueDateEnd;
    }
    if (filters.assigneeId) {
      where.assignments = {
        some: { userId: filters.assigneeId }
      };
    }
    if (filters.search) {
      where.title = { search: filters.search };
      where.description = { search: filters.search };
    }

    if (cursor) {
      const p = getCursorPagination(limit, cursor);
      const tasks = await prisma.task.findMany({
        where,
        take: p.take,
        skip: p.skip,
        cursor: p.cursor,
        orderBy: { createdAt: 'desc' },
      });

      return formatCursorResponse(tasks, limit);
    } else {
      const p = getOffsetPagination(limit, page);
      const [data, total] = await Promise.all([
        prisma.task.findMany({
          where,
          take: p.take,
          skip: p.skip,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.task.count({ where })
      ]);

      return { data, total, page: p.page, limit: p.limit };
    }
  },

  async getTaskById(organizationId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: { assignments: true, comments: true, project: true }
    });
    if (!task) throw new Error('Task not found');
    if (task.project.organizationId !== organizationId) throw new Error('Forbidden');
    return task;
  },

  async createTask(organizationId: string, data: any) {
    // Verify project belongs to org
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, organizationId, deletedAt: null }
    });
    if (!project) throw new Error('Project not found');

    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate,
        projectId: data.projectId,
      }
    });
  },

  async updateTask(organizationId: string, taskId: string, data: any) {
    await this.getTaskById(organizationId, taskId);

    return prisma.task.update({
      where: { id: taskId },
      data
    });
  },

  async deleteTask(organizationId: string, taskId: string) {
    await this.getTaskById(organizationId, taskId);

    return prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() }
    });
  },

  async assignUser(organizationId: string, taskId: string, userId: string) {
    await this.getTaskById(organizationId, taskId);
    
    // Verify user belongs to org
    const membership = await prisma.orgMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } }
    });
    if (!membership) throw new Error('Assigned user does not belong to the organization');

    // Consistency Strategy: We use Prisma's interactive transaction to ensure DB persistence.
    // We create the assignment and then enqueue to Redis within the transaction callback.
    // If Redis fails to enqueue (e.g. Redis is down), the promise rejects and Prisma automatically rolls back
    // the assignment creation, guaranteeing we never leave the system in an inconsistent state.
    const { emailQueue } = require('../jobs/queue');
    const timeBucket = Math.floor(Date.now() / 5000) * 5000;
    const jobId = `assign-${taskId}-${userId}-${timeBucket}`;

    const assignment = await prisma.$transaction(async (tx) => {
      const newAssignment = await tx.taskAssignment.create({
        data: { taskId, userId }
      });

      await emailQueue.add(
        'send-assignment-email',
        { taskId, userId, organizationId },
        {
          jobId, 
          attempts: 4, // 1 initial + 3 retries
          backoff: {
            type: 'exponential',
            delay: 1000, // 1s -> 2s -> 4s
          }
        }
      );

      return { assignment: newAssignment, jobId };
    });

    return assignment;
  },

  async unassignUser(organizationId: string, taskId: string, userId: string) {
    await this.getTaskById(organizationId, taskId);
    
    return prisma.taskAssignment.deleteMany({
      where: { taskId, userId }
    });
  },

  async addComment(organizationId: string, taskId: string, authorId: string, content: string) {
    await this.getTaskById(organizationId, taskId);

    return prisma.comment.create({
      data: {
        content,
        taskId,
        authorId
      }
    });
  },

  async getComments(organizationId: string, taskId: string) {
    await this.getTaskById(organizationId, taskId);

    return prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }
};
