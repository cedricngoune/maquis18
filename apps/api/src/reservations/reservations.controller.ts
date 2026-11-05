import { Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Réservation enregistrée (statut PENDING)' })
  @ApiBadRequestResponse({ description: 'Champs invalides ou créneau indisponible' })
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto);
  }
}
