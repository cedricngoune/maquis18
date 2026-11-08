import { Module } from '@nestjs/common';
import { CaptchaService } from '../captcha/captcha.service';
import { AdminReservationsController } from './admin-reservations.controller';
import { ReservationsCleanupService } from './reservations-cleanup.service';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  controllers: [ReservationsController, AdminReservationsController],
  providers: [ReservationsService, ReservationsCleanupService, CaptchaService],
})
export class ReservationsModule {}
