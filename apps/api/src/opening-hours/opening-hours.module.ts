import { Module } from '@nestjs/common';
import { AdminOpeningHoursController, OpeningHoursController } from './opening-hours.controller';
import { OpeningHoursService } from './opening-hours.service';

@Module({
  controllers: [OpeningHoursController, AdminOpeningHoursController],
  providers: [OpeningHoursService],
})
export class OpeningHoursModule {}
