import { Body, Controller, Ip, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiTags, ApiTooManyRequestsResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  // Anti-spam: at most 5 reservation attempts per IP address every 10 minutes
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  @ApiCreatedResponse({ description: 'Réservation enregistrée (statut PENDING), e-mail récapitulatif envoyé' })
  @ApiBadRequestResponse({ description: 'Champs invalides, créneau complet ou vérification anti-robot échouée' })
  @ApiTooManyRequestsResponse({ description: 'Trop de tentatives depuis cette adresse IP' })
  create(@Body() dto: CreateReservationDto, @Ip() ip: string) {
    return this.reservationsService.create(dto, ip);
  }
}
