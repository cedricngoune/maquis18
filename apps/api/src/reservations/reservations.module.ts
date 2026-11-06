import { Module } from '@nestjs/common';
import { CaptchaService } from '../captcha/captcha.service';
import { AdminReservationsController } from './admin-reservations.controller';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  controllers: [ReservationsController, AdminReservationsController],
  providers: [ReservationsService, CaptchaService],
})
export class ReservationsModule {}
