const request = require('supertest');
const app = require('../src/app');
const setup = require('./setup');
const User = require('../src/models/user.model');

beforeAll(async () => {
  await setup.connect();
});

afterAll(async () => {
  await setup.closeDatabase();
});

afterEach(async () => {
  await setup.clearDatabase();
});

describe('Auth: Signup & Login', () => {
  it('should signup a new user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Test User', email: 'test@example.com', password: 'password1' })
      .expect(201);

    expect(res.body.user.email).toBe('test@example.com');
    const dbUser = await User.findOne({ email: 'test@example.com' });
    expect(dbUser).not.toBeNull();
    expect(dbUser.password).not.toBe('password1'); // hashed
  });

  it('should not signup with same email', async () => {
    await User.create({ name: 'A', email: 'a@example.com', password: 'pass123' });
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'B', email: 'a@example.com', password: 'pass123' })
      .expect(400);
    expect(res.body.message).toMatch(/already/i);
  });

  it('should login with valid creds and return token', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Login User', email: 'login@example.com', password: 'pass123' })
      .expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'pass123' })
      .expect(200);

    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('should not login with wrong password', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Login User', email: 'login2@example.com', password: 'pass123' });

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'login2@example.com', password: 'wrong' })
      .expect(401);
  });
});
