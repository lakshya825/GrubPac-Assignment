import prisma from '../../src/utils/prisma';

export async function clearDatabase() {
  await prisma.$transaction([
    prisma.comment.deleteMany(),
    prisma.taskAssignment.deleteMany(),
    prisma.task.deleteMany(),
    prisma.project.deleteMany(),
    prisma.orgMember.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany()
  ]);
}
