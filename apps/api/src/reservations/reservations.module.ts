import { Module } from '@nestjs/common';
import { AdminReservationsController } from './admin-reservations.controller';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  controllers: [ReservationsController, AdminReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
