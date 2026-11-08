import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { LoginResponse } from '@maquis18/shared';
import type { Response } from 'express';
import { ADMIN_SESSION_COOKIE, sessionCookieOptions } from './auth.cookie';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200) // a login opens a session, it doesn't "create" a resource
  // Brute-force protection: at most 5 login attempts per IP address per minute
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiTooManyRequestsResponse({ description: 'Trop de tentatives de connexion' })
  @ApiOkResponse({ description: 'Profil admin ; le jeton est posé dans un cookie httpOnly' })
  @ApiUnauthorizedResponse({ description: 'Identifiants incorrects' })
  async login(
    @Body() dto: LoginDto,
    // passthrough: we only add a cookie, Nest still serializes the returned object
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const { admin, accessToken, expiresAt } = await this.authService.login(dto);
    response.cookie(ADMIN_SESSION_COOKIE, accessToken, sessionCookieOptions(expiresAt));
    return { admin };
  }

  @Post('logout')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Cookie de session supprimé' })
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(ADMIN_SESSION_COOKIE, sessionCookieOptions());
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiCookieAuth(ADMIN_SESSION_COOKIE)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Profil de l’admin connecté' })
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.getProfile(request.admin.sub);
  }
}
