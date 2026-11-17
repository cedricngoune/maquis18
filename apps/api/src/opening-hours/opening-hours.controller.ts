import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ADMIN_SESSION_COOKIE } from '../auth/auth.cookie';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateOpeningHoursDto } from './dto/update-opening-hours.dto';
import { OpeningHoursService } from './opening-hours.service';

@ApiTags('opening-hours')
@Controller('opening-hours')
export class OpeningHoursController {
  constructor(private readonly openingHoursService: OpeningHoursService) {}

  @Get()
  @ApiOkResponse({ description: 'Jours ouverts et leurs horaires, lundi en premier' })
  list() {
    return this.openingHoursService.list();
  }
}

@ApiTags('admin · horaires')
@ApiCookieAuth(ADMIN_SESSION_COOKIE)
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('admin/opening-hours')
export class AdminOpeningHoursController {
  constructor(private readonly openingHoursService: OpeningHoursService) {}

  @Get()
  @ApiOkResponse({ description: 'Les 7 jours, fermés compris' })
  listWeek() {
    return this.openingHoursService.listWeek();
  }

  @Put()
  @ApiOkResponse({ description: 'Semaine enregistrée' })
  replaceWeek(@Body() dto: UpdateOpeningHoursDto) {
    return this.openingHoursService.replaceWeek(dto.days);
  }
}
