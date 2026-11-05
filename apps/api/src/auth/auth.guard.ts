import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedRequest, JwtPayload } from './auth.types';

/**
 * Protects a route: the request must carry "Authorization: Bearer <token>"
 * with a valid, non-expired JWT signed by this API.
 * Usage: @UseGuards(AuthGuard) on a controller or a single route.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Connexion requise.');
    }

    try {
      request.admin = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Session expirée, merci de vous reconnecter.');
    }
    return true;
  }
}
