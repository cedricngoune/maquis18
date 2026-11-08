import request from 'supertest';
import { authHeader, createAdmin, createExpiredToken, createForgedToken, getAuthToken } from './fixtures/auth.fixture';
import { createCategory, resetDatabase } from './fixtures/database.fixture';
import { createTestApp, type TestContext } from './utils/create-test-app';

/** Every admin route must refuse anonymous and invalid requests */
const PROTECTED_ROUTES = [
  { method: 'get', path: '/admin/reservations' },
  { method: 'patch', path: '/admin/reservations/some-id' },
  { method: 'get', path: '/admin/categories' },
  { method: 'get', path: '/admin/dishes' },
  { method: 'post', path: '/admin/dishes' },
  { method: 'patch', path: '/admin/dishes/some-id' },
  { method: 'delete', path: '/admin/dishes/some-id' },
] as const;

describe('Admin routes protection (e2e)', () => {
  let ctx: TestContext;
  let admin: { id: string; email: string };

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    admin = await createAdmin(ctx.prisma);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe.each(PROTECTED_ROUTES)('$method $path', ({ method, path }) => {
    it('rejects a request without a token', async () => {
      await request(ctx.app.getHttpServer())[method](path).expect(401);
    });

    it('rejects a malformed Authorization header', async () => {
      await request(ctx.app.getHttpServer())[method](path).set('Authorization', 'Token abc').expect(401);
    });

    it('rejects an expired token', async () => {
      await request(ctx.app.getHttpServer())
        [method](path)
        .set(authHeader(createExpiredToken(admin)))
        .expect(401);
    });

    it('rejects a token signed with another secret', async () => {
      await request(ctx.app.getHttpServer())
        [method](path)
        .set(authHeader(createForgedToken(admin)))
        .expect(401);
    });
  });

  describe('with a valid token', () => {
    it('lists the reservations of the day', async () => {
      const token = await getAuthToken(ctx.app);

      const response = await request(ctx.app.getHttpServer())
        .get('/admin/reservations?date=2030-01-15')
        .set(authHeader(token))
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('creates a dish, then hides it from the public menu', async () => {
      const token = await getAuthToken(ctx.app);
      const category = await createCategory(ctx.prisma);

      const created = await request(ctx.app.getHttpServer())
        .post('/admin/dishes')
        .set(authHeader(token))
        .send({
          name: 'Thiéboudienne',
          description: 'Riz au poisson',
          priceInCents: 1500,
          tags: [],
          categoryId: category.id,
        })
        .expect(201);

      await request(ctx.app.getHttpServer())
        .patch(`/admin/dishes/${created.body.id}`)
        .set(authHeader(token))
        .send({ isAvailable: false })
        .expect(200);

      const menu = await request(ctx.app.getHttpServer()).get('/menu').expect(200);
      expect(menu.body[0].dishes).toEqual([]);
    });

    it('confirms a reservation', async () => {
      const token = await getAuthToken(ctx.app);
      const reservation = await ctx.prisma.reservation.create({
        data: { date: new Date('2030-01-15T00:00:00Z'), time: '20:00', guests: 2, name: 'Awa', phone: '0612345678' },
      });

      const response = await request(ctx.app.getHttpServer())
        .patch(`/admin/reservations/${reservation.id}`)
        .set(authHeader(token))
        .send({ status: 'CONFIRMED' })
        .expect(200);

      expect(response.body.status).toBe('CONFIRMED');
    });
  });
});
