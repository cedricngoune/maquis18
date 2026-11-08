import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const jwt = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '8h' } });
  let service: AuthService;
  const findUnique = jest.fn();

  beforeAll(async () => {
    const admin = { id: 'admin-1', email: 'admin@test.local', passwordHash: await hash('good-password', 4) };
    findUnique.mockImplementation(async ({ where }: { where: { email?: string; id?: string } }) =>
      where.email === admin.email || where.id === admin.id ? admin : null,
    );
    service = new AuthService({ adminUser: { findUnique } } as never, jwt);
  });

  describe('login', () => {
    it('returns the profile, a valid JWT and its expiry date', async () => {
      const before = Date.now();
      const result = await service.login({ email: 'admin@test.local', password: 'good-password' });

      expect(result.admin).toEqual({ id: 'admin-1', email: 'admin@test.local' });
      expect(jwt.verify(result.accessToken)).toMatchObject({ sub: 'admin-1', email: 'admin@test.local' });
      // 8 hours, give or take the test duration
      expect(result.expiresAt.getTime() - before).toBeGreaterThan(8 * 3600_000 - 5_000);
      expect(result.expiresAt.getTime() - before).toBeLessThanOrEqual(8 * 3600_000 + 1_000);
    });

    it('rejects a wrong password', async () => {
      await expect(service.login({ email: 'admin@test.local', password: 'wrong' })).rejects.toThrow(
        'E-mail ou mot de passe incorrect.',
      );
    });

    it('gives exactly the same answer for an unknown e-mail', async () => {
      await expect(service.login({ email: 'nobody@test.local', password: 'good-password' })).rejects.toThrow(
        'E-mail ou mot de passe incorrect.',
      );
    });
  });

  describe('getProfile', () => {
    it('returns the admin without the password hash', async () => {
      const profile = await service.getProfile('admin-1');

      expect(profile).toEqual({ id: 'admin-1', email: 'admin@test.local' });
      expect(profile).not.toHaveProperty('passwordHash');
    });

    it('rejects an admin that no longer exists', async () => {
      await expect(service.getProfile('deleted')).rejects.toThrow('Compte introuvable.');
    });
  });
});
