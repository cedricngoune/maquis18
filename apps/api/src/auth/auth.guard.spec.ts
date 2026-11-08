import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ADMIN_SESSION_COOKIE } from './auth.cookie';
import { AuthGuard } from './auth.guard';

const jwt = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '1h' } });
const guard = new AuthGuard(jwt);
const validToken = jwt.sign({ sub: 'admin-1', email: 'admin@test.local' });

/** Minimal ExecutionContext around a fake Express request */
function contextFor(request: { headers?: Record<string, string>; cookies?: Record<string, string> }) {
  const fullRequest = { headers: {}, ...request } as Record<string, unknown>;
  const context = { switchToHttp: () => ({ getRequest: () => fullRequest }) } as unknown as ExecutionContext;
  return { context, request: fullRequest };
}

describe('AuthGuard', () => {
  it('accepts the session cookie and exposes the admin on the request', async () => {
    const { context, request } = contextFor({ cookies: { [ADMIN_SESSION_COOKIE]: validToken } });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.admin).toMatchObject({ sub: 'admin-1', email: 'admin@test.local' });
  });

  it('accepts a Bearer token (API clients, Swagger)', async () => {
    const { context } = contextFor({ headers: { authorization: `Bearer ${validToken}` } });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects a request without any token', async () => {
    await expect(guard.canActivate(contextFor({}).context)).rejects.toThrow('Connexion requise.');
  });

  it('rejects another authentication scheme', async () => {
    const { context } = contextFor({ headers: { authorization: `Basic ${validToken}` } });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token signed with another secret', async () => {
    const forged = new JwtService({ secret: 'another-secret' }).sign({ sub: 'admin-1' });
    const { context } = contextFor({ cookies: { [ADMIN_SESSION_COOKIE]: forged } });

    await expect(guard.canActivate(context)).rejects.toThrow('Session expirée');
  });

  it('rejects an expired token', async () => {
    const expired = new JwtService({ secret: 'test-secret' }).sign({
      sub: 'admin-1',
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    const { context } = contextFor({ cookies: { [ADMIN_SESSION_COOKIE]: expired } });

    await expect(guard.canActivate(context)).rejects.toThrow('Session expirée');
  });
});
