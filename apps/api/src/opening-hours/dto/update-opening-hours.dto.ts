import { ApiProperty } from '@nestjs/swagger';
import type { OpeningDayInput, UpdateOpeningHoursRequest } from '@maquis18/shared';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const QUARTER_HOUR = /^([01]\d|2[0-3]):(00|15|30|45)$/;
const QUARTER_HOUR_MESSAGE = 'Choisissez une heure au quart d’heure (par exemple 11:00).';

export class OpeningDayDto implements OpeningDayInput {
  @ApiProperty({ minimum: 0, maximum: 6, description: '0 = dimanche … 6 = samedi' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isOpen: boolean;

  @ApiProperty({ example: '11:00' })
  @Matches(QUARTER_HOUR, { message: QUARTER_HOUR_MESSAGE })
  opensAt: string;

  @ApiProperty({ example: '22:00' })
  @Matches(QUARTER_HOUR, { message: QUARTER_HOUR_MESSAGE })
  closesAt: string;
}

export class UpdateOpeningHoursDto implements UpdateOpeningHoursRequest {
  @ApiProperty({ type: [OpeningDayDto], description: 'Les 7 jours de la semaine' })
  @IsArray()
  @ArrayMinSize(7, { message: 'Les 7 jours de la semaine sont attendus.' })
  @ArrayMaxSize(7, { message: 'Les 7 jours de la semaine sont attendus.' })
  @ValidateNested({ each: true })
  @Type(() => OpeningDayDto) // turns each plain object into an OpeningDayDto so its rules run
  days: OpeningDayDto[];
}
