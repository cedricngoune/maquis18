import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { MenuModule } from './menu/menu.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReservationsModule } from './reservations/reservations.module';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting: 100 requests per minute and per IP on every route by default.
    // Sensitive routes (login, reservation) set a stricter limit with @Throttle().
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }],
      errorMessage: 'Trop de tentatives. Merci de patienter quelques minutes avant de réessayer.',
      skipIf: () => process.env.NODE_ENV === 'test',
    }),
    ScheduleModule.forRoot(), // enables @Cron() jobs (nightly cleanup of old reservations)
    PrismaModule,
    MailModule,
    SmsModule,
    AuthModule,
    MenuModule,
    ReservationsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
