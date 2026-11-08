import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ADMIN_SESSION_COOKIE } from '../auth/auth.cookie';
import { AuthGuard } from '../auth/auth.guard';
import { ListReservationsQueryDto } from './dto/list-reservations-query.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { ReservationsService } from './reservations.service';

@ApiTags('admin · reservations')
@ApiCookieAuth(ADMIN_SESSION_COOKIE)
@ApiBearerAuth()
@UseGuards(AuthGuard) // every route below requires a logged-in admin
@Controller('admin/reservations')
export class AdminReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @ApiOkResponse({ description: 'Réservations du jour demandé, triées par heure' })
  list(@Query() query: ListReservationsQueryDto) {
    return this.reservationsService.listForDay(query.date);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Réservation mise à jour' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReservationStatusDto) {
    return this.reservationsService.updateStatus(id, dto.status);
  }
}
