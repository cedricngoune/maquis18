import request from 'supertest';
import { TEST_ADMIN, authHeader, createAdmin, getAuthToken } from './fixtures/auth.fixture';
import { resetDatabase } from './fixtures/database.fixture';
import { createTestApp, type TestContext } from './utils/create-test-app';

describe('Auth (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    await createAdmin(ctx.prisma);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('POST /auth/login', () => {
    it('sets an httpOnly session cookie and returns only the admin profile', async () => {
      const response = await request(ctx.app.getHttpServer()).post('/auth/login').send(TEST_ADMIN).expect(200);

      const cookie = ([] as string[]).concat(response.headers['set-cookie'] ?? []).join(';');
      expect(cookie).toContain('maquis18_admin=');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(response.body).toEqual({ admin: { id: expect.any(String), email: TEST_ADMIN.email } });
    });

    it('accepts the e-mail whatever its case and surrounding spaces', async () => {
      await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({ email: `  ${TEST_ADMIN.email.toUpperCase()} `, password: TEST_ADMIN.password })
        .expect(200);
    });

    it('rejects a wrong password with 401', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_ADMIN.email, password: 'wrong-password' })
        .expect(401);

      expect(response.body.message).toBe('E-mail ou mot de passe incorrect.');
    });

    it('gives the same answer for an unknown e-mail (does not reveal which accounts exist)', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@test.local', password: TEST_ADMIN.password })
        .expect(401);

      expect(response.body.message).toBe('E-mail ou mot de passe incorrect.');
    });

    it('returns per-field errors when the body is invalid', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: '' })
        .expect(400);

      expect(response.body.errors).toEqual({
        email: expect.any(String),
        password: expect.any(String),
      });
    });

    it('never returns the password hash', async () => {
      const response = await request(ctx.app.getHttpServer()).post('/auth/login').send(TEST_ADMIN).expect(200);

      expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    });
  });

  describe('GET /auth/me', () => {
    it('accepts the session cookie', async () => {
      const token = await getAuthToken(ctx.app);

      const response = await request(ctx.app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `maquis18_admin=${token}`)
        .expect(200);

      expect(response.body.email).toBe(TEST_ADMIN.email);
    });

    it('returns the logged-in admin (Bearer header)', async () => {
      const token = await getAuthToken(ctx.app);

      const response = await request(ctx.app.getHttpServer()).get('/auth/me').set(authHeader(token)).expect(200);

      expect(response.body.email).toBe(TEST_ADMIN.email);
    });

    it('rejects a request without a token', async () => {
      await request(ctx.app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('rejects a valid token whose admin has been deleted', async () => {
      const token = await getAuthToken(ctx.app);
      await ctx.prisma.adminUser.deleteMany();

      await request(ctx.app.getHttpServer()).get('/auth/me').set(authHeader(token)).expect(401);
    });
  });
});
