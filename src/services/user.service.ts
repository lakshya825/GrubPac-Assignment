import prisma from '../utils/prisma';

export const userService = {
  async getOrganizationUsersAvailability(organizationId: string) {
    // Find all users in the organization
    const members = await prisma.orgMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            assignments: {
              where: {
                task: {
                  status: { not: 'done' },
                  deletedAt: null
                }
              },
              include: {
                task: {
                  select: { id: true, title: true, status: true }
                }
              }
            }
          }
        }
      }
    });

    // Format the response
    return members.map((member) => {
      const activeTasksCount = member.user.assignments.length;
      return {
        userId: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        isFree: activeTasksCount === 0,
        activeTasks: activeTasksCount,
        tasks: member.user.assignments.map(a => a.task)
      };
    });
  }
};
