import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import request from 'supertest';
import type { LoginResponse } from '@maquis18/shared';
import type { PrismaService } from '../../src/prisma/prisma.service';

/** Credentials of the default test admin (test database only) */
export const TEST_ADMIN = {
  email: 'admin@test.local',
  password: 'test-password-123',
} as const;

type Credentials = { email: string; password: string };

/** Inserts an admin with a bcrypt-hashed password, exactly like the real seed does */
export async function createAdmin(prisma: PrismaService, credentials: Credentials = TEST_ADMIN) {
  // Cost 4 instead of 12: same algorithm, much faster for tests
  const passwordHash = await hash(credentials.password, 4);
  return prisma.adminUser.create({ data: { email: credentials.email, passwordHash } });
}

/** Logs in through the real POST /auth/login route and returns the JWT */
export async function getAuthToken(app: INestApplication, credentials: Credentials = TEST_ADMIN): Promise<string> {
  const response = await request(app.getHttpServer()).post('/auth/login').send(credentials).expect(200);
  return (response.body as LoginResponse).accessToken;
}

/** Shortcut for supertest: .set(authHeader(token)) */
export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

/** A token whose expiry date is already in the past, signed with the real secret */
export function createExpiredToken(admin: { id: string; email: string }): string {
  const jwt = new JwtService({ secret: process.env.JWT_SECRET });
  const oneMinuteAgo = Math.floor(Date.now() / 1000) - 60;
  return jwt.sign({ sub: admin.id, email: admin.email, exp: oneMinuteAgo });
}

/** A well-formed token signed with another secret: must be rejected */
export function createForgedToken(admin: { id: string; email: string }): string {
  return new JwtService({ secret: 'not-the-real-secret' }).sign({ sub: admin.id, email: admin.email });
}
