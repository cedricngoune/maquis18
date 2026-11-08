import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ADMIN_SESSION_COOKIE } from './auth.cookie';
import type { AuthenticatedRequest, JwtPayload } from './auth.types';

/**
 * Protects a route: the request must carry a valid, non-expired JWT signed by this API,
 * either in the httpOnly session cookie (the back-office) or in an
 * "Authorization: Bearer <token>" header (API clients, tests).
 * Usage: @UseGuards(AuthGuard) on a controller or a single route.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Connexion requise.');
    }

    try {
      request.admin = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Session expirée, merci de vous reconnecter.');
    }
    return true;
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const cookieToken = (request.cookies as Record<string, string> | undefined)?.[ADMIN_SESSION_COOKIE];
    if (cookieToken) return cookieToken;

    const [scheme, headerToken] = request.headers.authorization?.split(' ') ?? [];
    return scheme === 'Bearer' && headerToken ? headerToken : undefined;
  }
}
