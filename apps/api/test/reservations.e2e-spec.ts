import request from 'supertest';
import { resetDatabase, seedOpeningHours } from './fixtures/database.fixture';
import { createTestApp, type TestContext } from './utils/create-test-app';

/** A date safely in the future, as YYYY-MM-DD */
const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

const validReservation = () => ({
  date: inDays(30),
  time: '19:30',
  guests: 2,
  name: 'Awa Diallo',
  phone: '06 12 34 56 78',
  email: 'awa.diallo@example.com',
  captchaToken: 'test-token', // no TURNSTILE_SECRET_KEY in .env.test: the captcha check is skipped
});

describe('POST /reservations (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    await seedOpeningHours(ctx.prisma);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('creates a pending reservation', async () => {
    const response = await request(ctx.app.getHttpServer()).post('/reservations').send(validReservation()).expect(201);

    expect(response.body).toMatchObject({ guests: 2, name: 'Awa Diallo', status: 'PENDING' });
    expect(await ctx.prisma.reservation.count()).toBe(1);
  });

  it.each([
    ['too many guests', { guests: 9 }, 'guests'],
    ['invalid phone', { phone: '123' }, 'phone'],
    ['date in the past', { date: '2020-01-01' }, 'date'],
    ['before opening', { time: '10:30' }, 'time'],
    ['too close to closing', { time: '21:45' }, 'time'],
    ['impossible date', { date: '2030-02-31' }, 'date'],
    ['time not on a quarter hour', { time: '19:10' }, 'time'],
    ['invalid e-mail', { email: 'awa@' }, 'email'],
    ['missing captcha token', { captchaToken: '' }, 'captchaToken'],
  ])('rejects %s', async (_label, override, field) => {
    const response = await request(ctx.app.getHttpServer())
      .post('/reservations')
      .send({ ...validReservation(), ...override })
      .expect(400);

    expect(response.body.errors).toHaveProperty(field);
    expect(await ctx.prisma.reservation.count()).toBe(0);
  });

  it('rejects unknown properties (no status injection from the public form)', async () => {
    await request(ctx.app.getHttpServer())
      .post('/reservations')
      .send({ ...validReservation(), status: 'CONFIRMED' })
      .expect(400);
  });
});
