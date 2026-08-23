import prisma from '../utils/prisma';

export const projectService = {
  async getProjects(organizationId: string) {
    return prisma.project.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getProjectById(organizationId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null }
    });
    if (!project) throw new Error('Project not found');
    if (project.organizationId !== organizationId) throw new Error('Forbidden');
    return project;
  },

  async createProject(organizationId: string, data: { name: string; description?: string }) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const id = `${slug}-${randomNum}`;

    return prisma.project.create({
      data: {
        id,
        ...data,
        organizationId
      }
    });
  },

  async updateProject(organizationId: string, projectId: string, data: { name?: string; description?: string }) {
    // Verify existence & ownership first
    await this.getProjectById(organizationId, projectId);

    return prisma.project.update({
      where: { id: projectId },
      data
    });
  },

  async deleteProject(organizationId: string, projectId: string) {
    // Verify existence & ownership first
    await this.getProjectById(organizationId, projectId);

    // Soft delete
    return prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() }
    });
  },

  async getDashboard(organizationId: string, projectId: string) {
    // Verify existence & ownership first
    await this.getProjectById(organizationId, projectId);

    const taskCounts = await prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId,
        deletedAt: null
      },
      _count: {
        id: true
      }
    });

    // Format the result into a clean object (e.g., { todo: 5, done: 2 })
    const dashboard: Record<string, number> = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0
    };

    taskCounts.forEach((group) => {
      dashboard[group.status] = group._count.id;
    });

    return {
      projectId,
      taskCounts: dashboard
    };
  }
};
