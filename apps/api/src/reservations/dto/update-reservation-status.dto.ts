import { ApiProperty } from '@nestjs/swagger';
import type { ReservationStatus, UpdateReservationStatusRequest } from '@maquis18/shared';
import { IsIn } from 'class-validator';

const STATUSES: ReservationStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED'];

export class UpdateReservationStatusDto implements UpdateReservationStatusRequest {
  @ApiProperty({ enum: STATUSES, example: 'CONFIRMED' })
  @IsIn(STATUSES, { message: 'Statut inconnu.' })
  status: ReservationStatus;
}
