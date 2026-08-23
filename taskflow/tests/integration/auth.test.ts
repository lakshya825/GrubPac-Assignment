import request from 'supertest';
import app from '../../src/server';
import { clearDatabase } from '../helpers/test-db';

beforeEach(async () => {
  await clearDatabase();
});

describe('Auth Endpoints (Integration)', () => {
  it('should register a new user and login successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    // 1. Register
    const registerRes = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    expect(registerRes.body).toHaveProperty('accessToken');
    expect(registerRes.body.user.email).toBe(userData.email);

    // 2. Login
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    expect(loginRes.body).toHaveProperty('accessToken');
    expect(loginRes.body).toHaveProperty('refreshToken');
    expect(loginRes.body.user.email).toBe(userData.email);
  });

  it('should return 401 for invalid login', async () => {
    await request(app)
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })
      .expect(401);
  });
});
