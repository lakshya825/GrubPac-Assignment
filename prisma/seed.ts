import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing database...');
  await prisma.comment.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.orgMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  // 1. Create 5 Users
  const users = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.user.create({
        data: {
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          password: hashedPassword,
        },
      })
    )
  );

  // 2. Create 2 Organizations
  const org1 = await prisma.organization.create({
    data: { name: 'Acme Corp' },
  });
  const org2 = await prisma.organization.create({
    data: { name: 'Globex Inc' },
  });

  // 3. Assign Members to Orgs
  // Org 1: User 1 (Admin), User 2, User 3
  await prisma.orgMember.createMany({
    data: [
      { userId: users[0].id, organizationId: org1.id, role: 'org_admin' },
      { userId: users[1].id, organizationId: org1.id, role: 'member' },
      { userId: users[2].id, organizationId: org1.id, role: 'member' },
    ],
  });

  // Org 2: User 4 (Admin), User 5
  await prisma.orgMember.createMany({
    data: [
      { userId: users[3].id, organizationId: org2.id, role: 'org_admin' },
      { userId: users[4].id, organizationId: org2.id, role: 'member' },
    ],
  });

  // 4. Create Projects
  const project1 = await prisma.project.create({
    data: { id: 'website-redesign-1234', name: 'Website Redesign', organizationId: org1.id },
  });
  const project2 = await prisma.project.create({
    data: { id: 'mobile-app-5678', name: 'Mobile App', organizationId: org1.id },
  });
  const project3 = await prisma.project.create({
    data: { id: 'internal-dashboard-9012', name: 'Internal Dashboard', organizationId: org2.id },
  });

  // 5. Create Tasks and Assignments
  const tasksToCreate = [
    { title: 'Design Homepage', status: 'done', priority: 'high', projectId: project1.id, assignee: users[0] },
    { title: 'Implement Header', status: 'in_progress', priority: 'medium', projectId: project1.id, assignee: users[1] },
    { title: 'Write Copy', status: 'todo', priority: 'low', projectId: project1.id, assignee: users[2] },
    { title: 'Setup React Native', status: 'done', priority: 'urgent', projectId: project2.id, assignee: users[0] },
    { title: 'Create Navigation', status: 'review', priority: 'medium', projectId: project2.id, assignee: users[1] },
    { title: 'Push Notifications', status: 'todo', priority: 'high', projectId: project2.id, assignee: null },
    { title: 'Database Schema', status: 'in_progress', priority: 'urgent', projectId: project3.id, assignee: users[3] },
    { title: 'API Endpoints', status: 'todo', priority: 'medium', projectId: project3.id, assignee: users[4] },
    { title: 'Frontend Integration', status: 'todo', priority: 'low', projectId: project3.id, assignee: null },
    { title: 'User Testing', status: 'todo', priority: 'high', projectId: project3.id, assignee: null },
  ];

  for (const t of tasksToCreate) {
    const task = await prisma.task.create({
      data: {
        title: t.title,
        status: t.status as any,
        priority: t.priority as any,
        projectId: t.projectId,
      },
    });

    if (t.assignee) {
      await prisma.taskAssignment.create({
        data: { taskId: task.id, userId: t.assignee.id },
      });
      // Add a comment
      await prisma.comment.create({
        data: {
          taskId: task.id,
          authorId: t.assignee.id,
          content: `I will start working on ${t.title}.`,
        },
      });
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
