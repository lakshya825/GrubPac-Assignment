import request from 'supertest';
import app from '../../src/server';
import { clearDatabase } from '../helpers/test-db';
import prisma from '../../src/utils/prisma';
import { generateTokens } from '../../src/utils/jwt';

let userA: any, userB: any;
let orgA: any, orgB: any;
let projectA: any, projectB: any;
let tokenA: string, tokenB: string;

beforeEach(async () => {
  await clearDatabase();

  // Setup Test Data
  userA = await prisma.user.create({ data: { name: 'User A', email: 'a@example.com', password: 'hash' } });
  userB = await prisma.user.create({ data: { name: 'User B', email: 'b@example.com', password: 'hash' } });

  orgA = await prisma.organization.create({ data: { name: 'Org A' } });
  orgB = await prisma.organization.create({ data: { name: 'Org B' } });

  await prisma.orgMember.create({ data: { userId: userA.id, organizationId: orgA.id, role: 'org_admin' } });
  await prisma.orgMember.create({ data: { userId: userB.id, organizationId: orgB.id, role: 'member' } });

  projectA = await prisma.project.create({ data: { id: 'proj-a-1', name: 'Project A', organizationId: orgA.id } });
  projectB = await prisma.project.create({ data: { id: 'proj-b-1', name: 'Project B', organizationId: orgB.id } });

  tokenA = generateTokens(userA.id).accessToken;
  tokenB = generateTokens(userB.id).accessToken;
});

describe('Task Endpoints (Integration)', () => {
  it('should create and fetch a task', async () => {
    // Create
    const createRes = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id)
      .send({
        title: 'New Task',
        projectId: projectA.id
      })
      .expect(201);

    const taskId = createRes.body.id;
    expect(createRes.body.title).toBe('New Task');

    // Fetch
    const getRes = await request(app)
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id)
      .expect(200);

    expect(getRes.body.id).toBe(taskId);
  });

  it('should return 400 for validation error', async () => {
    await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id)
      .send({
        // Missing title
        projectId: projectA.id
      })
      .expect(400);
  });

  it('should enforce cross-tenant access isolation', async () => {
    // 1. User A creates a task in Org A
    const task = await prisma.task.create({
      data: { title: 'Secret Task', projectId: projectA.id }
    });

    // 2. User B tries to fetch the task using Org B context (User B belongs to Org B)
    // The task belongs to Org A project, so it should not be found or forbidden.
    const res = await request(app)
      .get(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('X-Organization-Id', orgB.id)
      .expect(404); // Our service returns 404 "Task not found" for cross-tenant access to not leak existence

    expect(res.body.error).toBe('Task not found');
  });

  it('should return 403 if user tries to use an organization they do not belong to', async () => {
    await request(app)
      .get(`/tasks`)
      .set('Authorization', `Bearer ${tokenB}`) // User B
      .set('X-Organization-Id', orgA.id) // Tries to access Org A
      .expect(403);
  });
});
