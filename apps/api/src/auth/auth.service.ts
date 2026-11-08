import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AdminProfileDto } from '@maquis18/shared';
import { compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from './auth.types';
import { LoginDto } from './dto/login.dto';

export type LoginResult = {
  admin: AdminProfileDto;
  /** Signed JWT: the controller puts it in the httpOnly cookie, never in the response body */
  accessToken: string;
  /** Same expiry as the token, so the cookie and the JWT expire together */
  expiresAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login({ email, password }: LoginDto): Promise<LoginResult> {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });

    // Same message whether the e-mail or the password is wrong: we don't reveal which accounts exist
    const isValid = admin !== null && (await compare(password, admin.passwordHash));
    if (!admin || !isValid) {
      throw new UnauthorizedException('E-mail ou mot de passe incorrect.');
    }

    const payload: JwtPayload = { sub: admin.id, email: admin.email };
    const accessToken = await this.jwtService.signAsync(payload);
    const { exp } = this.jwtService.decode<{ exp: number }>(accessToken);

    return {
      admin: { id: admin.id, email: admin.email },
      accessToken,
      expiresAt: new Date(exp * 1000),
    };
  }

  async getProfile(adminId: string): Promise<AdminProfileDto> {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new UnauthorizedException('Compte introuvable.');
    }
    return { id: admin.id, email: admin.email };
  }
}
