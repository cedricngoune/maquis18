import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiTooManyRequestsResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200) // a login returns a token, it doesn't "create" a resource
  // Brute-force protection: at most 5 login attempts per IP address per minute
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiTooManyRequestsResponse({ description: 'Trop de tentatives de connexion' })
  @ApiOkResponse({ description: 'Jeton JWT et profil admin' })
  @ApiUnauthorizedResponse({ description: 'Identifiants incorrects' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Profil de l’admin connecté' })
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.getProfile(request.admin.sub);
  }
}
